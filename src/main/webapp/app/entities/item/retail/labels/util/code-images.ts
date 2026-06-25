import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { BARCODE_SYMBOLOGY_FORMAT, BarcodeSymbology, LabelTextAlign } from '../model/label-template.model';

// Single source of truth for barcode/QR images so the on-screen preview and the PDF look identical.

export const BARCODE_PAD_FRACTION = 0.04;
export const BARCODE_PAD_MAX_MM = 2;

export const barcodePadMm = (widthMm: number): number => Math.min(widthMm * BARCODE_PAD_FRACTION, BARCODE_PAD_MAX_MM);

const barcodeModuleCount = (data: string, symbology: BarcodeSymbology): number => {
  switch (symbology) {
    case 'code39':
      return Math.max(40, data.length * 13 + 25);
    case 'ean8':
      return 67;
    case 'ean13':
    case 'upcA':
      return 95;
    case 'upcE':
      return 51;
    case 'code128':
    default:
      return Math.max(55, data.length * 11 + 35);
  }
};

const barcodeModuleMm = (symbology: BarcodeSymbology): number => {
  switch (symbology) {
    case 'code39':
      return 0.32;
    case 'ean8':
    case 'ean13':
    case 'upcA':
    case 'upcE':
      return 0.33;
    case 'code128':
    default:
      return 0.25;
  }
};

export const barcodeContentRectMm = (
  widthMm: number,
  _heightMm: number,
  alignment: LabelTextAlign,
  data: string,
  symbology: BarcodeSymbology
): { xMm: number; widthMm: number } => {
  const padX = barcodePadMm(widthMm);
  const maxWidthMm = Math.max(1, widthMm - padX * 2);
  const preferredWidthMm = Math.max(12, barcodeModuleCount(data, symbology) * barcodeModuleMm(symbology));
  const renderWidthMm = Math.min(maxWidthMm, preferredWidthMm);
  const freeMm = Math.max(0, widthMm - renderWidthMm);
  const offsetX = alignment === 'left' ? 0 : alignment === 'right' ? freeMm : freeMm / 2;
  return { xMm: offsetX, widthMm: renderWidthMm };
};

export const barcodePngDataUrl = (data: string, symbology: string): string | null => {
  try {
    return barcodeCanvas(data, symbology)?.toDataURL('image/png') ?? null;
  } catch {
    return null;
  }
};

export const barcodeCanvas = (data: string, symbology: string): HTMLCanvasElement | null => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, data, {
      format: BARCODE_SYMBOLOGY_FORMAT[symbology] || 'CODE128',
      displayValue: false,
      margin: 0,
      width: 6,
      height: 480,
    });
    return canvas;
  } catch {
    return null;
  }
};

export const qrPngDataUrl = async (data: string): Promise<string | null> => {
  try {
    return await QRCode.toDataURL(data, { margin: 0, width: 1024, errorCorrectionLevel: 'M' });
  } catch {
    return null;
  }
};
