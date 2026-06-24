import { jsPDF } from 'jspdf';
import { LabelElement, LabelTemplate } from '../model/label-template.model';
import { barcodePadMm, barcodePngDataUrl, qrPngDataUrl } from '../util/code-images';
import {
  LabelDatum,
  demoBarcodeData,
  resolveBarcodeData,
  resolveElementText,
  resolvePriceParts,
  resolveProductImage,
  resolveQrData,
} from '../util/label-data';
import { validateBarcodeData } from '../model/label-template.model';
import { DEFAULT_LINE_HEIGHT, DEFAULT_MIN_FONT_PT, TextLayoutResult, fitComparePrice, layoutLabelText } from '../util/text-layout';
import { PT_PER_MM } from '../util/units';
import { ContainRect, containRect, loadImage, mmToRasterPx, rasterizeRotated } from './rotate-raster';
import { PrinterOffset, ZERO_OFFSET } from './printer-calibration';

const RASTER_DPI = 300;
const mmPx = (mm: number): number => (mm / 25.4) * RASTER_DPI;

export interface FlatPdfLabel {
  datum: LabelDatum;
}

const orientationFor = (w: number, h: number): 'landscape' | 'portrait' => (w >= h ? 'landscape' : 'portrait');

interface LoadedImage {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

const blobToDataUrl = (blob: Blob): Promise<string | null> =>
  new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

const imageDimensions = (src: string): Promise<{ w: number; h: number }> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = src;
  });

// Canvas fallback: works for same-origin images, or cross-origin images served with CORS headers.
const loadViaCanvas = (url: string): Promise<LoadedImage | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve({ dataUrl: canvas.toDataURL('image/png'), naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const loadImageDataUrl = async (url: string): Promise<LoadedImage | null> => {
  // Preferred: fetch the bytes directly. This bypasses the <canvas> taint that drops cross-origin
  // images from the PDF, as long as the host allows a cross-origin GET (most CDNs do for images).
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (res.ok) {
      const dataUrl = await blobToDataUrl(await res.blob());
      if (dataUrl && dataUrl.startsWith('data:image')) {
        const { w, h } = await imageDimensions(dataUrl);
        return { dataUrl, naturalWidth: w, naturalHeight: h };
      }
    }
  } catch {
    /* fall through to the canvas method */
  }
  return loadViaCanvas(url);
};

const textLayoutFor = (element: LabelElement, text: string): TextLayoutResult =>
  layoutLabelText({
    text,
    fontSizePt: element.fontSize,
    bold: element.fontBold,
    widthMm: element.widthMm,
    heightMm: element.heightMm,
    autoFit: element.autoFit ?? true,
    minFontPt: element.minFontSize ?? DEFAULT_MIN_FONT_PT,
    lineHeight: element.lineHeight ?? DEFAULT_LINE_HEIGHT,
    maxLines: element.maxLines ?? 0,
  });

const addRotated = (doc: jsPDF, element: LabelElement, drawn: ReturnType<typeof rasterizeRotated>) => {
  if (!drawn) return;
  const cx = element.xMm + element.widthMm / 2;
  const cy = element.yMm + element.heightMm / 2;
  doc.addImage(drawn.dataUrl, 'PNG', cx - drawn.widthMm / 2, cy - drawn.heightMm / 2, drawn.widthMm, drawn.heightMm);
};

const paintTextCanvas = (
  ctx: CanvasRenderingContext2D,
  heightPx: number,
  widthPx: number,
  element: LabelElement,
  layout: TextLayoutResult
) => {
  const lineHeight = element.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const fontPx = mmPx((layout.fontSizePt / PT_PER_MM));
  const lineHeightPx = fontPx * lineHeight;
  const blockHeight = layout.lines.length * lineHeightPx;
  const vAlign = element.verticalAlign ?? 'middle';
  const top = vAlign === 'top' ? 0 : vAlign === 'bottom' ? heightPx - blockHeight : (heightPx - blockHeight) / 2;
  const align = element.alignment;
  const x = align === 'center' ? widthPx / 2 : align === 'right' ? widthPx : 0;

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  ctx.font = `${element.fontBold ? '700' : '400'} ${fontPx}px Arial, Helvetica, sans-serif`;

  layout.lines.forEach((line, i) => {
    if (line) ctx.fillText(line, x, top + i * lineHeightPx + lineHeightPx / 2);
  });
};

const drawText = (doc: jsPDF, element: LabelElement, datum: LabelDatum, useFormattedVariantName: boolean) => {
  const text = resolveElementText(element, datum, useFormattedVariantName);
  if (!text) return;
  const layout = textLayoutFor(element, text);
  if (layout.lines.length === 0) return;

  if (element.rotation) {
    addRotated(
      doc,
      element,
      rasterizeRotated(element.widthMm, element.heightMm, element.rotation, (ctx, w, h) => paintTextCanvas(ctx, h, w, element, layout))
    );
    return;
  }

  doc.setFont('helvetica', element.fontBold ? 'bold' : 'normal');
  doc.setFontSize(layout.fontSizePt);
  doc.setTextColor(0, 0, 0);

  const lineHeightMm = (layout.fontSizePt / PT_PER_MM) * (element.lineHeight ?? DEFAULT_LINE_HEIGHT);
  const blockHeight = layout.lines.length * lineHeightMm;
  const vAlign = element.verticalAlign ?? 'middle';
  const top =
    vAlign === 'top'
      ? element.yMm
      : vAlign === 'bottom'
      ? element.yMm + element.heightMm - blockHeight
      : element.yMm + (element.heightMm - blockHeight) / 2;

  const align = element.alignment;
  const x = align === 'center' ? element.xMm + element.widthMm / 2 : align === 'right' ? element.xMm + element.widthMm : element.xMm;

  layout.lines.forEach((line, i) => {
    if (!line) return;
    doc.text(line, x, top + i * lineHeightMm + lineHeightMm / 2, { align, baseline: 'middle' });
  });
};

const drawImageContent = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, widthPx: number, heightPx: number, padXMm: number) => {
  const padPx = mmPx(padXMm);
  ctx.drawImage(img, padPx, 0, Math.max(1, widthPx - padPx * 2), heightPx);
};

// Original price (struck through) followed by the sale price — matches the on-screen compare layout.
const drawComparePrice = (doc: jsPDF, element: LabelElement, current: string, original: string) => {
  const fit = fitComparePrice(current, original, element.fontSize, element.widthMm, element.heightMm, {
    autoFit: element.autoFit ?? true,
    minFontPt: element.minFontSize ?? DEFAULT_MIN_FONT_PT,
  });
  const curSize = fit.currentPt;
  const origSize = fit.originalPt;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(origSize);
  const origW = doc.getTextWidth(original);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(curSize);
  const curW = doc.getTextWidth(current);

  const gap = fit.gapMm;
  const totalW = origW + gap + curW;
  const align = element.alignment;
  const startX =
    align === 'center'
      ? element.xMm + (element.widthMm - totalW) / 2
      : align === 'right'
      ? element.xMm + element.widthMm - totalW
      : element.xMm;

  const halfLine = curSize / PT_PER_MM / 2;
  const vAlign = element.verticalAlign ?? 'middle';
  const y =
    vAlign === 'top'
      ? element.yMm + halfLine
      : vAlign === 'bottom'
      ? element.yMm + element.heightMm - halfLine
      : element.yMm + element.heightMm / 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(origSize);
  doc.setTextColor(107, 114, 128);
  doc.text(original, startX, y, { baseline: 'middle' });
  doc.setDrawColor(107, 114, 128);
  doc.setLineWidth((origSize / PT_PER_MM) * 0.07);
  doc.line(startX, y, startX + origW, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(curSize);
  doc.setTextColor(0, 0, 0);
  doc.text(current, startX + origW + gap, y, { baseline: 'middle' });
};

const drawElement = async (doc: jsPDF, element: LabelElement, datum: LabelDatum, useFormattedVariantName: boolean): Promise<void> => {
  if (!element.visible) return;
  const { xMm, yMm, widthMm, heightMm } = element;
  const rotated = Boolean(element.rotation);

  if (element.type === 'barcode') {
    const symbology = element.barcodeSymbology ?? 'code128';
    const data = resolveBarcodeData(datum) || demoBarcodeData(symbology);
    if (validateBarcodeData(symbology, data)) return;
    const padX = barcodePadMm(widthMm);
    const url = barcodePngDataUrl(data, symbology);
    if (!url) return;
    if (rotated) {
      const img = await loadImage(url);
      if (img) {
        addRotated(
          doc,
          element,
          rasterizeRotated(widthMm, heightMm, element.rotation, (ctx, w, h) => drawImageContent(ctx, img, w, h, padX))
        );
      }
    } else {
      doc.addImage(url, 'PNG', xMm + padX, yMm, widthMm - padX * 2, heightMm);
    }
    return;
  }

  if (element.type === 'qrCode') {
    const data = resolveQrData(element, datum);
    if (!data) return;
    const side = Math.min(widthMm, heightMm);
    const url = await qrPngDataUrl(data);
    if (!url) return;
    if (rotated) {
      const img = await loadImage(url);
      if (img) {
        addRotated(
          doc,
          element,
          rasterizeRotated(widthMm, heightMm, element.rotation, (ctx, w, h) => {
            const sidePx = Math.min(w, h);
            ctx.drawImage(img, (w - sidePx) / 2, (h - sidePx) / 2, sidePx, sidePx);
          })
        );
      }
    } else {
      doc.addImage(url, 'PNG', xMm + (widthMm - side) / 2, yMm + (heightMm - side) / 2, side, side);
    }
    return;
  }

  if (element.type === 'productImage') {
    const src = resolveProductImage(datum);
    if (!src) return;
    const loaded = await loadImageDataUrl(src);
    if (!loaded) return;
    const fit: ContainRect = containRect(xMm, yMm, widthMm, heightMm, loaded.naturalWidth, loaded.naturalHeight);
    if (rotated) {
      const img = await loadImage(loaded.dataUrl);
      if (img) {
        addRotated(
          doc,
          element,
          rasterizeRotated(widthMm, heightMm, element.rotation, (ctx, w, h) => {
            const innerW = mmToRasterPx(fit.widthMm);
            const innerH = mmToRasterPx(fit.heightMm);
            ctx.drawImage(img, (w - innerW) / 2, (h - innerH) / 2, innerW, innerH);
          })
        );
      }
    } else {
      doc.addImage(loaded.dataUrl, 'PNG', fit.xMm, fit.yMm, fit.widthMm, fit.heightMm);
    }
    return;
  }

  if (element.type === 'logo') {
    if (!element.value) return;
    const loaded = await loadImageDataUrl(element.value);
    if (!loaded) return;
    const fit: ContainRect = containRect(xMm, yMm, widthMm, heightMm, loaded.naturalWidth, loaded.naturalHeight);
    if (rotated) {
      const img = await loadImage(loaded.dataUrl);
      if (img) {
        addRotated(
          doc,
          element,
          rasterizeRotated(widthMm, heightMm, element.rotation, (ctx, w, h) => {
            const innerW = mmToRasterPx(fit.widthMm);
            const innerH = mmToRasterPx(fit.heightMm);
            ctx.drawImage(img, (w - innerW) / 2, (h - innerH) / 2, innerW, innerH);
          })
        );
      }
    } else {
      doc.addImage(loaded.dataUrl, 'PNG', fit.xMm, fit.yMm, fit.widthMm, fit.heightMm);
    }
    return;
  }

  if (element.type === 'price' && element.showComparePrice && !element.rotation) {
    const parts = resolvePriceParts(datum.variant);
    if (parts.current && parts.original) {
      drawComparePrice(doc, element, parts.current, parts.original);
      return;
    }
  }

  drawText(doc, element, datum, useFormattedVariantName);
};

const offsetElements = (elements: LabelElement[], offset: PrinterOffset): LabelElement[] => {
  if (offset.xMm === 0 && offset.yMm === 0) return elements;
  return elements.map(el => ({ ...el, xMm: el.xMm + offset.xMm, yMm: el.yMm + offset.yMm }));
};

export const buildLabelsPdf = async (
  template: LabelTemplate,
  labels: FlatPdfLabel[],
  useFormattedVariantName = true,
  offset: PrinterOffset = ZERO_OFFSET
): Promise<jsPDF> => {
  const { widthMm, heightMm } = template;
  const orientation = orientationFor(widthMm, heightMm);
  const doc = new jsPDF({ unit: 'mm', format: [widthMm, heightMm], orientation, compress: true });
  const elements = offsetElements(template.elements, offset);

  for (let i = 0; i < labels.length; i++) {
    if (i > 0) doc.addPage([widthMm, heightMm], orientation);
    for (const element of elements) {
      await drawElement(doc, element, labels[i].datum, useFormattedVariantName);
    }
  }

  return doc;
};

export const exportLabelsPdf = async (template: LabelTemplate, labels: FlatPdfLabel[], useFormattedVariantName = true): Promise<void> => {
  if (labels.length === 0) return;
  const doc = await buildLabelsPdf(template, labels, useFormattedVariantName);
  doc.save(`labels-${template.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};

export const labelsPdfBase64 = async (
  template: LabelTemplate,
  labels: FlatPdfLabel[],
  useFormattedVariantName = true,
  offset: PrinterOffset = ZERO_OFFSET
): Promise<string> => {
  const doc = await buildLabelsPdf(template, labels, useFormattedVariantName, offset);
  const uri = doc.output('datauristring');
  return uri.substring(uri.indexOf(',') + 1);
};
