import { LabelElement, LabelElementType, LabelTemplate, LabelTextAlign } from './label-template.model';

const el = (
  id: string,
  type: LabelElementType,
  xMm: number,
  yMm: number,
  widthMm: number,
  heightMm: number,
  fontSize: number,
  fontBold: boolean,
  alignment: LabelTextAlign,
  extra: Partial<LabelElement> = {}
): LabelElement => ({
  id,
  type,
  xMm,
  yMm,
  widthMm,
  heightMm,
  fontSize,
  fontBold,
  alignment,
  rotation: 0,
  visible: true,
  value: null,
  ...extra,
});

const logoRetailTag: LabelTemplate = {
  id: 'preset-logo-retail-tag',
  name: 'Logo Retail Tag',
  description: 'Brand image, large price, name, barcode — landscape retail label',
  widthMm: 100,
  heightMm: 60,
  orientation: 'landscape',
  templateType: 'visual',
  directPrint: null,
  isDefault: true,
  isActive: true,
  elements: [
    el('lrt-logo', 'productImage', 3, 3, 30, 28, 8, false, 'center'),
    el('lrt-price', 'price', 36, 3, 61, 28, 36, true, 'center'),
    el('lrt-name', 'productName', 3, 33, 94, 10, 13, true, 'left'),
    el('lrt-barcode', 'barcode', 18, 44, 64, 12, 7, false, 'center', { barcodeSymbology: 'code128' }),
    el('lrt-sku', 'sku', 18, 56, 64, 4, 6, false, 'center'),
  ],
};

const priceTag: LabelTemplate = {
  id: 'preset-price-tag',
  name: 'Price Tag',
  description: 'Product name, large price, barcode',
  widthMm: 58,
  heightMm: 40,
  orientation: 'portrait',
  templateType: 'visual',
  directPrint: null,
  isDefault: false,
  isActive: true,
  elements: [
    el('pt-name', 'productName', 2, 2, 54, 7, 9, true, 'center'),
    el('pt-price', 'price', 2, 10, 54, 13, 20, true, 'center'),
    el('pt-barcode', 'barcode', 4, 25, 50, 12, 7, false, 'center', { barcodeSymbology: 'code128' }),
    el('pt-sku', 'sku', 2, 37, 54, 3, 6, false, 'center'),
  ],
};

const shelfLabel: LabelTemplate = {
  id: 'preset-shelf-label',
  name: 'Shelf Label',
  description: 'Name, SKU, price, barcode, category',
  widthMm: 80,
  heightMm: 50,
  orientation: 'portrait',
  templateType: 'visual',
  directPrint: null,
  isDefault: false,
  isActive: true,
  elements: [
    el('sl-name', 'productName', 2, 2, 76, 8, 11, true, 'left'),
    el('sl-sku', 'sku', 2, 12, 42, 5, 8, false, 'left'),
    el('sl-price', 'price', 46, 12, 32, 5, 11, true, 'right'),
    el('sl-barcode', 'barcode', 4, 19, 72, 18, 7, false, 'center', { barcodeSymbology: 'code128' }),
    el('sl-category', 'category', 2, 39, 76, 5, 8, false, 'left'),
    el('sl-brand', 'brand', 2, 45, 76, 4, 7, false, 'right'),
  ],
};

const qrLabel: LabelTemplate = {
  id: 'preset-qr-label',
  name: 'QR Code Label',
  description: 'Name, QR code, price and SKU',
  widthMm: 60,
  heightMm: 60,
  orientation: 'portrait',
  templateType: 'visual',
  directPrint: null,
  isDefault: false,
  isActive: true,
  elements: [
    el('qr-name', 'productName', 2, 2, 56, 8, 10, true, 'left'),
    el('qr-code', 'qrCode', 2, 12, 34, 34, 8, false, 'center', { qrDataType: 'sku' }),
    el('qr-price', 'price', 38, 12, 20, 12, 14, true, 'center'),
    el('qr-sku', 'sku', 38, 26, 20, 8, 7, false, 'center'),
    el('qr-barcode', 'barcode', 2, 48, 56, 10, 7, false, 'center', { barcodeSymbology: 'code128' }),
  ],
};

const minimalTag: LabelTemplate = {
  id: 'preset-minimal-tag',
  name: 'Minimal Tag',
  description: 'Name, barcode, SKU — compact thermal label',
  widthMm: 50,
  heightMm: 25,
  orientation: 'landscape',
  templateType: 'visual',
  directPrint: null,
  isDefault: false,
  isActive: true,
  elements: [
    el('mt-name', 'productName', 2, 1, 46, 6, 8, true, 'center'),
    el('mt-barcode', 'barcode', 2, 8, 46, 12, 7, false, 'center', { barcodeSymbology: 'code128' }),
    el('mt-sku', 'sku', 2, 20, 46, 4, 6, false, 'center'),
  ],
};

const fullDetail: LabelTemplate = {
  id: 'preset-full-detail',
  name: 'Full Detail',
  description: 'All product fields — name, description, price, barcode',
  widthMm: 100,
  heightMm: 70,
  orientation: 'portrait',
  templateType: 'visual',
  directPrint: null,
  isDefault: false,
  isActive: true,
  elements: [
    el('fd-name', 'productName', 2, 2, 96, 10, 14, true, 'left'),
    el('fd-category', 'category', 2, 14, 46, 5, 8, false, 'left'),
    el('fd-brand', 'brand', 50, 14, 48, 5, 8, false, 'right'),
    el('fd-price', 'price', 2, 21, 96, 18, 24, true, 'center'),
    el('fd-desc', 'description', 2, 41, 96, 7, 7, false, 'left'),
    el('fd-barcode', 'barcode', 10, 50, 80, 15, 7, false, 'center', { barcodeSymbology: 'code128' }),
    el('fd-sku', 'sku', 2, 66, 96, 4, 6, false, 'center'),
  ],
};

export const LABEL_PRESETS: LabelTemplate[] = [logoRetailTag, priceTag, shelfLabel, qrLabel, minimalTag, fullDetail];

export const DEFAULT_PRESET = logoRetailTag;

export const isPresetId = (id: string): boolean => id.startsWith('preset-');
