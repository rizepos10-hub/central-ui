import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { BARCODE_SYMBOLOGY_FORMAT } from '../model/label-template.model';

// Single source of truth for barcode/QR images so the on-screen preview and the PDF look identical.

export const BARCODE_PAD_FRACTION = 0.04;
export const BARCODE_PAD_MAX_MM = 2;

export const barcodePadMm = (widthMm: number): number => Math.min(widthMm * BARCODE_PAD_FRACTION, BARCODE_PAD_MAX_MM);

export const barcodePngDataUrl = (data: string, symbology: string): string | null => {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, data, {
      format: BARCODE_SYMBOLOGY_FORMAT[symbology] || 'CODE128',
      displayValue: false,
      margin: 0,
      width: 6,
      height: 480,
    });
    return canvas.toDataURL('image/png');
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
