import { BARCODE_SYMBOLOGY_FORMAT, DirectPrintLanguage, LabelElement, LabelTemplate } from '../model/label-template.model';
import { LabelDatum, demoBarcodeData, resolveBarcodeData, resolveElementText, resolvePriceParts, resolveQrData } from './label-data';
import { barcodeCanvas, barcodeContentRectMm } from './code-images';
import { DEFAULT_LINE_HEIGHT, DEFAULT_MIN_FONT_PT, layoutComparePrice, layoutLabelText, measureTextMm } from './text-layout';
import { PT_PER_MM } from './units';

export interface DirectPrintCompileResult {
  script: string;
  warnings: string[];
  qzPayload?: {
    type: 'raw-image' | 'raw-command-hex';
    language?: 'epl';
    base64?: string;
    data?: string;
    x?: number;
    y?: number;
  };
}

const mmToDots = (mm: number, dpi: number): number => Math.max(0, Math.round((mm / 25.4) * dpi));
const ptToDots = (pt: number, dpi: number): number => Math.max(12, Math.round((pt / 72) * dpi));
const escapeText = (value: string): string => (value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
const visibleElements = (template: LabelTemplate): LabelElement[] =>
  template.elements.filter(element => element.visible).sort((a, b) => a.yMm - b.yMm || a.xMm - b.xMm);
const EPL_COMMAND_DPI = 203;

const rotationForZpl = (rotation: number): 'N' | 'R' | 'I' | 'B' => {
  const deg = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  if (deg === 90) return 'R';
  if (deg === 180) return 'I';
  if (deg === 270) return 'B';
  return 'N';
};

const rotationForTspl = (rotation: number): number => {
  const deg = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  return deg;
};

const rotationForEpl = (rotation: number): number => {
  const deg = ((Math.round(rotation / 90) * 90) % 360 + 360) % 360;
  if (deg === 90) return 1;
  if (deg === 180) return 2;
  if (deg === 270) return 3;
  return 0;
};

const alignForZpl = (alignment: LabelElement['alignment']): 'L' | 'C' | 'R' =>
  alignment === 'center' ? 'C' : alignment === 'right' ? 'R' : 'L';

const barcodeTypeForTspl = (element: LabelElement): string => BARCODE_SYMBOLOGY_FORMAT[element.barcodeSymbology ?? 'code128'] ?? '128';
const barcodeRect = (element: LabelElement, value: string): { xMm: number; widthMm: number } =>
  barcodeContentRectMm(element.widthMm, element.heightMm, element.alignment, value, element.barcodeSymbology ?? 'code128');

const barcodeModuleCount = (value: string, element: LabelElement): number => {
  switch (element.barcodeSymbology ?? 'code128') {
    case 'code39':
      return Math.max(40, value.length * 13 + 25);
    case 'ean8':
      return 67;
    case 'ean13':
    case 'upcA':
      return 95;
    case 'upcE':
      return 51;
    case 'code128':
    default:
      return Math.max(55, value.length * 11 + 35);
  }
};

const barcodeModuleWidthDots = (element: LabelElement, value: string, dpi: number): number => {
  const rect = barcodeRect(element, value);
  const totalDots = mmToDots(rect.widthMm, dpi);
  return Math.max(1, Math.min(10, Math.round(totalDots / Math.max(1, barcodeModuleCount(value, element)))));
};

const barcodeCommandForZpl = (element: LabelElement): string => {
  switch (element.barcodeSymbology ?? 'code128') {
    case 'code39':
      return '^B3';
    case 'ean13':
      return '^BE';
    case 'ean8':
      return '^B8';
    case 'upcA':
      return '^BU';
    case 'upcE':
      return '^B9';
    case 'code128':
    default:
      return '^BC';
  }
};

const elementText = (element: LabelElement, datum: LabelDatum): string => {
  if (element.type === 'price') return resolvePriceParts(datum.variant).current;
  return resolveElementText(element, datum);
};

const effectiveAlignment = (element: LabelElement, datum: LabelDatum): LabelElement['alignment'] => {
  if (element.type === 'price' && element.showComparePrice) {
    const parts = resolvePriceParts(datum.variant);
    if (parts.current && !parts.original) return 'center';
  }
  return element.alignment;
};

const textLayoutFor = (element: LabelElement, text: string) =>
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

const lineStartMm = (element: LabelElement, line: string, fontSizePt: number, alignment: LabelElement['alignment']): number => {
  const lineWidthMm = measureTextMm(line, fontSizePt, element.fontBold);
  if (alignment === 'center') return element.xMm + Math.max(0, (element.widthMm - lineWidthMm) / 2);
  if (alignment === 'right') return element.xMm + Math.max(0, element.widthMm - lineWidthMm);
  return element.xMm;
};

const lineTopMm = (element: LabelElement, lineCount: number, fontSizePt: number): number => {
  const lineHeightMm = (fontSizePt / PT_PER_MM) * (element.lineHeight ?? DEFAULT_LINE_HEIGHT);
  const blockHeightMm = lineCount * lineHeightMm;
  const verticalAlign = element.verticalAlign ?? 'middle';
  if (verticalAlign === 'top') return element.yMm;
  if (verticalAlign === 'bottom') return element.yMm + Math.max(0, element.heightMm - blockHeightMm);
  return element.yMm + Math.max(0, (element.heightMm - blockHeightMm) / 2);
};

const escapeZplText = (value: string): string => (value || '').replace(/\\/g, '\\\\').replace(/\^/g, ' ').replace(/~/g, ' ');
const EPL_FONT_SPECS = [
  { font: 1, charW: 8, charH: 12 },
  { font: 2, charW: 10, charH: 16 },
  { font: 3, charW: 12, charH: 20 },
  { font: 4, charW: 14, charH: 24 },
  { font: 5, charW: 32, charH: 48 },
] as const;
type EplFontChoice = { font: number; xMul: number; yMul: number; charW: number; charH: number };

const eplFontForPt = (pt: number): EplFontChoice => {
  const targetHeight = ptToDots(pt, EPL_COMMAND_DPI);
  let best: EplFontChoice = { ...EPL_FONT_SPECS[0], xMul: 1, yMul: 1 };
  let bestScore = Number.POSITIVE_INFINITY;

  for (const spec of EPL_FONT_SPECS) {
    const maxScale = spec.font === 5 ? 3 : 6;
    for (let yMul = 1; yMul <= maxScale; yMul++) {
      for (let xMul = 1; xMul <= maxScale; xMul++) {
        const height = spec.charH * yMul;
        const score = Math.abs(height - targetHeight) + Math.abs(xMul - yMul) * 1.5;
        if (score < bestScore) {
          best = { ...spec, xMul, yMul };
          bestScore = score;
        }
      }
    }
  }

  return best;
};

const eplLineWidthDots = (
  line: string,
  fontSpec: { font: number; xMul: number; yMul: number; charW: number; charH: number }
): number => Math.round(line.length * fontSpec.charW * fontSpec.xMul);

const eplTextBlockTopDots = (element: LabelElement, lineCount: number, fontSpec: { charH: number; yMul: number }): number => {
  const boxTop = mmToDots(element.yMm, EPL_COMMAND_DPI);
  const boxHeight = mmToDots(element.heightMm, EPL_COMMAND_DPI);
  const lineAdvance = Math.max(fontSpec.charH * fontSpec.yMul, Math.round(fontSpec.charH * fontSpec.yMul * (element.lineHeight ?? DEFAULT_LINE_HEIGHT)));
  const blockHeight = lineAdvance * lineCount;
  const verticalAlign = element.verticalAlign ?? 'middle';
  if (verticalAlign === 'top') return boxTop;
  if (verticalAlign === 'bottom') return boxTop + Math.max(0, boxHeight - blockHeight);
  return boxTop + Math.max(0, Math.round((boxHeight - blockHeight) / 2));
};

const eplLineStartDots = (
  element: LabelElement,
  line: string,
  fontSpec: { font: number; xMul: number; yMul: number; charW: number; charH: number },
  alignment: LabelElement['alignment']
): number => {
  const boxLeft = mmToDots(element.xMm, EPL_COMMAND_DPI);
  const boxWidth = mmToDots(element.widthMm, EPL_COMMAND_DPI);
  const lineWidth = eplLineWidthDots(line, fontSpec);
  if (alignment === 'center') return boxLeft + Math.max(0, Math.round((boxWidth - lineWidth) / 2));
  if (alignment === 'right') return boxLeft + Math.max(0, boxWidth - lineWidth);
  return boxLeft;
};

const drawTextBlock = (
  ctx: CanvasRenderingContext2D,
  element: LabelElement,
  text: string,
  dpi: number,
  alignmentOverride?: LabelElement['alignment']
) => {
  const layout = textLayoutFor(element, text);
  if (layout.lines.length === 0) return;

  const fontPx = ptToDots(layout.fontSizePt, dpi);
  const lineHeight = element.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const lineHeightPx = fontPx * lineHeight;
  const blockHeightPx = lineHeightPx * layout.lines.length;
  const topPx = mmToDots(lineTopMm(element, layout.lines.length, layout.fontSizePt), dpi);
  const align = alignmentOverride ?? element.alignment;
  const xPx =
    align === 'center'
      ? mmToDots(element.xMm + element.widthMm / 2, dpi)
      : align === 'right'
      ? mmToDots(element.xMm + element.widthMm, dpi)
      : mmToDots(element.xMm, dpi);

  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
  ctx.font = `${element.fontBold ? '700' : '400'} ${fontPx}px Arial, Helvetica, sans-serif`;

  layout.lines.forEach((line, index) => {
    if (!line) return;
    const yPx = topPx + index * lineHeightPx + lineHeightPx / 2;
    ctx.fillText(line, xPx, yPx);
  });
};

const drawPriceBlock = (ctx: CanvasRenderingContext2D, element: LabelElement, datum: LabelDatum, dpi: number): boolean => {
  if (!element.showComparePrice) return false;
  const parts = resolvePriceParts(datum.variant);
  if (!parts.current) return true;
  if (!parts.original) {
    drawTextBlock(ctx, element, parts.current, dpi, 'center');
    return true;
  }

  const compareStyle = element.comparePriceStyle ?? 'strikethrough';
  const layout = layoutComparePrice(parts.current, parts.original, compareStyle, {
    fontSizePt: element.fontSize,
    widthMm: element.widthMm,
    heightMm: element.heightMm,
    alignment: element.alignment,
    verticalAlign: element.verticalAlign ?? 'middle',
    autoFit: element.autoFit ?? true,
    minFontPt: element.minFontSize ?? DEFAULT_MIN_FONT_PT,
    arrangement: element.comparePriceLayout ?? 'stacked',
  });

  // Use the exact pt→dot size the layout assumed (no min-12 clamp) so the was/now sizes and positions line
  // up identically to the canvas/preview, in both the stacked and inline arrangements.
  const priceFontPx = (pt: number): number => Math.max(1, Math.round((pt / 72) * dpi));
  const wasPx = priceFontPx(layout.wasPt);
  const nowPx = priceFontPx(layout.nowPt);
  const wasXPx = mmToDots(element.xMm + layout.wasXMm, dpi);
  const wasYPx = mmToDots(element.yMm + layout.wasYMm, dpi);
  const wasWidthPx = mmToDots(layout.wasWidthMm, dpi);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#000000';
  ctx.font = `700 ${wasPx}px Arial, Helvetica, sans-serif`;
  ctx.fillText(layout.wasText, wasXPx, wasYPx);
  if (layout.strike) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, wasPx * 0.08);
    ctx.beginPath();
    ctx.moveTo(wasXPx, wasYPx);
    ctx.lineTo(wasXPx + wasWidthPx, wasYPx);
    ctx.stroke();
  }

  ctx.fillStyle = '#000000';
  ctx.font = `700 ${nowPx}px Arial, Helvetica, sans-serif`;
  ctx.fillText(layout.nowText, mmToDots(element.xMm + layout.nowXMm, dpi), mmToDots(element.yMm + layout.nowYMm, dpi));
  return true;
};

const drawBarcodeBlock = (ctx: CanvasRenderingContext2D, element: LabelElement, datum: LabelDatum, dpi: number): boolean => {
  const symbology = element.barcodeSymbology ?? 'code128';
  const value = resolveBarcodeData(datum) || demoBarcodeData(symbology);
  const source = barcodeCanvas(value, symbology);
  if (!source) return false;
  const rect = barcodeRect(element, value);
  ctx.drawImage(
    source,
    mmToDots(element.xMm + rect.xMm, dpi),
    mmToDots(element.yMm, dpi),
    mmToDots(rect.widthMm, dpi),
    mmToDots(element.heightMm, dpi)
  );
  return true;
};

const renderExactCanvas = (template: LabelTemplate, datum: LabelDatum, dpi: number): HTMLCanvasElement | null => {
  if (typeof document === 'undefined') return null;
  if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '')) return null;
  const width = mmToDots(template.widthMm, dpi);
  const height = mmToDots(template.heightMm, dpi);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  for (const element of visibleElements(template)) {
    if (element.type === 'logo' || element.type === 'productImage' || element.type === 'qrCode') return null;
    if (element.type === 'barcode') {
      drawBarcodeBlock(ctx, element, datum, dpi);
      continue;
    }
    if (element.type === 'price' && drawPriceBlock(ctx, element, datum, dpi)) continue;
    const text = elementText(element, datum);
    if (!text) continue;
    drawTextBlock(ctx, element, text, dpi, effectiveAlignment(element, datum));
  }

  return canvas;
};

const rasterCanvasBytes = (canvas: HTMLCanvasElement): { hex: string; bytesPerRow: number; totalBytes: number; height: number } | null => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const bytesPerRow = Math.ceil(canvas.width / 8);
  const bytes: number[] = new Array(bytesPerRow * canvas.height).fill(0);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      const alpha = image[index + 3];
      if (alpha < 8) continue;
      const luminance = image[index] * 0.299 + image[index + 1] * 0.587 + image[index + 2] * 0.114;
      if (luminance > 210) continue;
      const byteIndex = y * bytesPerRow + Math.floor(x / 8);
      bytes[byteIndex] += [128, 64, 32, 16, 8, 4, 2, 1][x % 8];
    }
  }

  const hex = bytes.map(byte => byte.toString(16).padStart(2, '0').toUpperCase()).join('');
  return { hex, bytesPerRow, totalBytes: bytes.length, height: canvas.height };
};

const renderZplCanvas = (template: LabelTemplate, datum: LabelDatum, dpi: number): { hex: string; bytesPerRow: number; totalBytes: number } | null => {
  const canvas = renderExactCanvas(template, datum, dpi);
  if (!canvas) return null;
  const raster = rasterCanvasBytes(canvas);
  if (!raster) return null;
  return { hex: raster.hex, bytesPerRow: raster.bytesPerRow, totalBytes: raster.totalBytes };
};

const renderEplExact = (template: LabelTemplate, datum: LabelDatum, _dpi: number): DirectPrintCompileResult | null => {
  const canvas = renderExactCanvas(template, datum, EPL_COMMAND_DPI);
  if (!canvas) return null;
  const raster = rasterCanvasBytes(canvas);
  if (!raster) return null;
  const width = mmToDots(template.widthMm, EPL_COMMAND_DPI);
  const header = `N\nq${width}\nQ${raster.height},24\nGW0,0,${raster.bytesPerRow},${raster.height},`;
  const footer = '\nP1';
  const headerHex = Array.from(header, char => char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join('');
  const footerHex = Array.from(footer, char => char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join('');
  const payloadHex = `${headerHex}${raster.hex}${footerHex}`;
  return {
    script: [
      '# Exact EPL GW payload',
      `N`,
      `q${width}`,
      `Q${raster.height},24`,
      `GW0,0,${raster.bytesPerRow},${raster.height},<binary raster data>`,
      `P1`,
      '',
      '# HEX transport payload for QZ/raw testers',
      payloadHex,
    ].join('\n'),
    warnings: [
      'Exact EPL uses binary GW raster bytes. Plain-text EPL websites may not accept the human-readable preview above unless they support raw hex/binary payloads.',
    ],
    qzPayload: {
      type: 'raw-command-hex',
      data: payloadHex,
    },
  };
};

const compileZplNative = (template: LabelTemplate, datum: LabelDatum, dpi: number): DirectPrintCompileResult => {
  const warnings: string[] = [];
  const width = mmToDots(template.widthMm, dpi);
  const height = mmToDots(template.heightMm, dpi);
  const lines = ['^XA', '^CI28', `^PW${width}`, `^LL${height}`];

  for (const element of visibleElements(template)) {
    const x = mmToDots(element.xMm, dpi);
    const w = mmToDots(element.widthMm, dpi);
    const h = mmToDots(element.heightMm, dpi);
    const rotation = rotationForZpl(element.rotation);

    if (element.type === 'barcode') {
      const value = resolveBarcodeData(datum);
      if (!value) {
        warnings.push('Barcode element has no SKU/data for this product.');
        continue;
      }
      const rect = barcodeRect(element, value);
      const moduleWidth = barcodeModuleWidthDots(element, value, dpi);
      lines.push(
        `^FO${mmToDots(element.xMm + rect.xMm, dpi)},${mmToDots(element.yMm, dpi)}^BY${moduleWidth},2,${Math.max(30, h)}${barcodeCommandForZpl(
          element
        )}${rotation},${Math.max(
          30,
          h
        )},Y,N,N^FD${escapeText(value)}^FS`
      );
      continue;
    }

    if (element.type === 'qrCode') {
      const value = resolveQrData(element, datum);
      if (!value) {
        warnings.push('QR element has no data for this product.');
        continue;
      }
      lines.push(`^FO${x},${mmToDots(element.yMm, dpi)}^BQN,2,${Math.max(2, Math.round(Math.min(w, h) / 48))}^FDLA,${escapeText(value)}^FS`);
      continue;
    }

    if (element.type === 'logo' || element.type === 'productImage') {
      warnings.push(`${element.type === 'logo' ? 'Logo' : 'Product image'} is not compiled into native ${'ZPL'} commands yet.`);
      continue;
    }

    const text = elementText(element, datum);
    if (!text) continue;
    const layout = textLayoutFor(element, text);
    if (layout.lines.length === 0) continue;
    const align = effectiveAlignment(element, datum);
    const joined = layout.lines.map(line => escapeZplText(line || ' ')).join('\\&');
    const top = mmToDots(lineTopMm(element, layout.lines.length, layout.fontSizePt), dpi);
    const font = ptToDots(layout.fontSizePt, dpi);
    lines.push(
      `^FO${x},${top}^A0${rotation},${font},${Math.max(12, Math.round(font * 0.9))}^FB${Math.max(
        w,
        1
      )},${Math.max(1, layout.lines.length)},0,${alignForZpl(align)},0^FH\\^FD${joined}^FS`
    );
  }

  lines.push('^XZ');
  return { script: lines.join('\n'), warnings };
};

const compileZpl = (template: LabelTemplate, datum: LabelDatum, dpi: number): DirectPrintCompileResult => {
  const rendered = renderZplCanvas(template, datum, dpi);
  if (!rendered) {
    const native = compileZplNative(template, datum, dpi);
    return {
      ...native,
      warnings: [
        'Exact ZPL parity mode currently supports text, price, and barcode elements. Falling back to native ZPL commands for unsupported elements.',
        ...native.warnings,
      ],
    };
  }

  const width = mmToDots(template.widthMm, dpi);
  const height = mmToDots(template.heightMm, dpi);
  return {
    script: ['^XA', '^CI28', `^PW${width}`, `^LL${height}`, `^FO0,0^GFA,${rendered.totalBytes},${rendered.totalBytes},${rendered.bytesPerRow},${rendered.hex}^FS`, '^XZ'].join(
      '\n'
    ),
    warnings: [],
  };
};

const compileTspl = (template: LabelTemplate, datum: LabelDatum, dpi: number): DirectPrintCompileResult => {
  const warnings: string[] = [];
  const lines = [
    `SIZE ${template.widthMm.toFixed(2)} mm, ${template.heightMm.toFixed(2)} mm`,
    'GAP 0 mm, 0 mm',
    `DENSITY ${dpi >= 300 ? 10 : 8}`,
    'DIRECTION 1',
    'CLS',
  ];

  for (const element of visibleElements(template)) {
    const y = mmToDots(element.yMm, dpi);
    const h = mmToDots(element.heightMm, dpi);
    const rotation = rotationForTspl(element.rotation);

    if (element.type === 'barcode') {
      const value = resolveBarcodeData(datum);
      if (!value) {
        warnings.push('Barcode element has no SKU/data for this product.');
        continue;
      }
      const rect = barcodeRect(element, value);
      const moduleWidth = barcodeModuleWidthDots(element, value, dpi);
      lines.push(
        `BARCODE ${mmToDots(element.xMm + rect.xMm, dpi)},${y},"${barcodeTypeForTspl(element)}",${Math.max(40, h)},1,${rotation},${moduleWidth},${Math.max(
          moduleWidth * 2,
          moduleWidth + 1
        )},"${escapeText(value)}"`
      );
      continue;
    }

    if (element.type === 'qrCode') {
      const value = resolveQrData(element, datum);
      if (!value) {
        warnings.push('QR element has no data for this product.');
        continue;
      }
      lines.push(`QRCODE ${mmToDots(element.xMm, dpi)},${y},L,5,A,${rotation},"${escapeText(value)}"`);
      continue;
    }

    if (element.type === 'logo' || element.type === 'productImage') {
      warnings.push(`${element.type === 'logo' ? 'Logo' : 'Product image'} is not compiled into native TSPL commands yet.`);
      continue;
    }

    const text = elementText(element, datum);
    if (!text) continue;
    const align = effectiveAlignment(element, datum);
    const layout = textLayoutFor(element, text);
    if (layout.lines.length === 0) continue;
    const scale = Math.max(1, Math.round(layout.fontSizePt / 10));
    const topMm = lineTopMm(element, layout.lines.length, layout.fontSizePt);
    const lineHeightMm = (layout.fontSizePt / PT_PER_MM) * (element.lineHeight ?? DEFAULT_LINE_HEIGHT);
    layout.lines.forEach((line, index) => {
      if (!line) return;
      const lineX = mmToDots(lineStartMm(element, line, layout.fontSizePt, align), dpi);
      const lineY = mmToDots(topMm + index * lineHeightMm, dpi);
      lines.push(`TEXT ${lineX},${lineY},"0",${rotation},${scale},${scale},"${escapeText(line)}"`);
    });
  }

  lines.push('PRINT 1,1');
  return { script: lines.join('\n'), warnings };
};

const compileEpl = (template: LabelTemplate, datum: LabelDatum, _dpi: number): DirectPrintCompileResult => {
  const exact = renderEplExact(template, datum, EPL_COMMAND_DPI);
  const warnings: string[] = [];
  const lines = ['N', `q${mmToDots(template.widthMm, EPL_COMMAND_DPI)}`, `Q${mmToDots(template.heightMm, EPL_COMMAND_DPI)},24`];

  for (const element of visibleElements(template)) {
    const y = mmToDots(element.yMm, EPL_COMMAND_DPI);
    const h = mmToDots(element.heightMm, EPL_COMMAND_DPI);
    const rotation = rotationForEpl(element.rotation);

    if (element.type === 'barcode') {
      const value = resolveBarcodeData(datum);
      if (!value) {
        warnings.push('Barcode element has no SKU/data for this product.');
        continue;
      }
      const rect = barcodeRect(element, value);
      const moduleWidth = barcodeModuleWidthDots(element, value, EPL_COMMAND_DPI);
      lines.push(
        `B${mmToDots(element.xMm + rect.xMm, EPL_COMMAND_DPI)},${y},${rotation},1,${moduleWidth},${Math.max(
          moduleWidth * 2,
          moduleWidth + 1
        )},${Math.max(
          40,
          h
        )},N,"${escapeText(value)}"`
      );
      continue;
    }

    if (element.type === 'qrCode') {
      warnings.push('QR codes are not compiled into native EPL commands yet.');
      continue;
    }

    if (element.type === 'logo' || element.type === 'productImage') {
      warnings.push(`${element.type === 'logo' ? 'Logo' : 'Product image'} is not compiled into native EPL commands yet.`);
      continue;
    }

    const text = elementText(element, datum);
    if (!text) continue;
    const align = effectiveAlignment(element, datum);
    const layout = textLayoutFor(element, text);
    if (layout.lines.length === 0) continue;
    const fontSpec = eplFontForPt(layout.fontSizePt);
    const top = eplTextBlockTopDots(element, layout.lines.length, fontSpec);
    const lineAdvance = Math.max(fontSpec.charH * fontSpec.yMul, Math.round(fontSpec.charH * fontSpec.yMul * (element.lineHeight ?? DEFAULT_LINE_HEIGHT)));
    layout.lines.forEach((line, index) => {
      if (!line) return;
      const lineX = eplLineStartDots(element, line, fontSpec, align);
      const lineY = top + index * lineAdvance;
      lines.push(`A${lineX},${lineY},${rotation},${fontSpec.font},${fontSpec.xMul},${fontSpec.yMul},N,"${escapeText(line)}"`);
    });
  }

  lines.push('P1');
  const nativeScript = lines.join('\n');
  if (exact) {
    return {
      ...exact,
      script: nativeScript,
      warnings: [
        `EPL native preview is normalized to ${EPL_COMMAND_DPI} DPI for stable placement across printer emulations.`,
        'Displayed EPL is the website-friendly/native version. QZ direct printing still uses the exact raster GW payload behind the scenes.',
        ...exact.warnings,
      ],
    };
  }

  return {
    script: nativeScript,
    warnings: [
      `EPL native preview is normalized to ${EPL_COMMAND_DPI} DPI for stable placement across printer emulations.`,
      'Exact EPL mode currently supports text, price, and barcode elements in the real browser runtime. Falling back to native EPL commands for unsupported cases.',
      ...warnings,
    ],
  };
};

export const compileDirectPrintTemplate = (
  template: LabelTemplate,
  datum: LabelDatum,
  language: DirectPrintLanguage = template.directPrint?.language ?? 'zpl',
  dpi: number = template.directPrint?.dpi ?? 203
): DirectPrintCompileResult => {
  switch (language) {
    case 'epl':
      return compileEpl(template, datum, dpi);
    case 'tspl':
      return compileTspl(template, datum, dpi);
    case 'zpl':
    default:
      return compileZpl(template, datum, dpi);
  }
};
