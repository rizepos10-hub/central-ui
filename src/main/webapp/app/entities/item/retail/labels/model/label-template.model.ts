export type LabelElementType =
  | 'productName'
  | 'sku'
  | 'barcode'
  | 'qrCode'
  | 'price'
  | 'category'
  | 'brand'
  | 'description'
  | 'customText'
  | 'logo'
  | 'productImage';

export type BarcodeSymbology = 'code128' | 'code39' | 'ean8' | 'ean13' | 'upcA' | 'upcE';

export type QrDataType = 'productUrl' | 'sku' | 'internalId' | 'custom';

export type LabelTextAlign = 'left' | 'center' | 'right';

export type ComparePriceStyle = 'strikethrough' | 'was';

export type ComparePriceArrangement = 'stacked' | 'inline';

export type LabelVerticalAlign = 'top' | 'middle' | 'bottom';

export type LabelOrientation = 'portrait' | 'landscape';
export type LabelTemplateType = 'visual' | 'direct';
export type DirectPrintLanguage = 'epl' | 'zpl' | 'tspl';

export interface DirectPrintSettings {
  language: DirectPrintLanguage;
  printerName?: string | null;
  dpi?: number;
}

export interface LabelElement {
  id: string;
  type: LabelElementType;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  fontSize: number;
  fontBold: boolean;
  alignment: LabelTextAlign;
  verticalAlign?: LabelVerticalAlign;
  autoFit?: boolean;
  minFontSize?: number;
  lineHeight?: number;
  maxLines?: number;
  rotation: number;
  visible: boolean;
  value?: string | null;
  showComparePrice?: boolean;
  comparePriceStyle?: ComparePriceStyle;
  comparePriceLayout?: ComparePriceArrangement;
  barcodeSymbology?: BarcodeSymbology;
  qrDataType?: QrDataType;
}

export interface LabelTemplate {
  id: string;
  name: string;
  description?: string | null;
  widthMm: number;
  heightMm: number;
  orientation: LabelOrientation;
  templateType: LabelTemplateType;
  directPrint?: DirectPrintSettings | null;
  isDefault: boolean;
  isActive: boolean;
  elements: LabelElement[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_DIRECT_PRINT_LANGUAGE: DirectPrintLanguage = 'zpl';

export const createDirectPrintSettings = (overrides: Partial<DirectPrintSettings> = {}): DirectPrintSettings => ({
  language: DEFAULT_DIRECT_PRINT_LANGUAGE,
  printerName: null,
  dpi: 203,
  ...overrides,
});

export const normalizeLabelTemplate = (template: LabelTemplate): LabelTemplate => {
  const templateType = template.templateType ?? 'visual';
  return {
    ...template,
    templateType,
    directPrint: templateType === 'direct' ? createDirectPrintSettings(template.directPrint ?? {}) : null,
    elements: Array.isArray(template.elements) ? template.elements : [],
  };
};

export const ELEMENT_TYPE_LABELS: Record<LabelElementType, string> = {
  productName: 'Name',
  sku: 'SKU',
  barcode: 'Barcode',
  qrCode: 'QR Code',
  price: 'Price',
  category: 'Category',
  brand: 'Brand',
  description: 'Description',
  customText: 'Custom',
  logo: 'Logo',
  productImage: 'Product Image',
};

export const ELEMENT_TYPE_COLORS: Record<LabelElementType, string> = {
  productName: '#2563eb',
  price: '#16a34a',
  barcode: '#475569',
  qrCode: '#0ea5e9',
  sku: '#7c3aed',
  category: '#d97706',
  brand: '#9333ea',
  description: '#64748b',
  customText: '#0ea5e9',
  logo: '#2563eb',
  productImage: '#7c3aed',
};

export const BARCODE_SYMBOLOGY_LABELS: Record<BarcodeSymbology, string> = {
  code128: 'Code 128',
  code39: 'Code 39',
  ean8: 'EAN-8',
  ean13: 'EAN-13',
  upcA: 'UPC-A',
  upcE: 'UPC-E',
};

export const BARCODE_SYMBOLOGY_FORMAT: Record<BarcodeSymbology, string> = {
  code128: 'CODE128',
  code39: 'CODE39',
  ean8: 'EAN8',
  ean13: 'EAN13',
  upcA: 'UPC',
  upcE: 'UPCE',
};

export const TEMPLATE_TYPE_LABELS: Record<LabelTemplateType, string> = {
  visual: 'Visual Designer',
  direct: 'Direct Printing',
};

export const DIRECT_PRINT_LANGUAGE_LABELS: Record<DirectPrintLanguage, string> = {
  epl: 'EPL',
  zpl: 'ZPL',
  tspl: 'TSPL',
};

export const COMPARE_PRICE_STYLE_LABELS: Record<ComparePriceStyle, string> = {
  strikethrough: 'Strikethrough',
  was: 'Was price label',
};

export const COMPARE_PRICE_LAYOUT_LABELS: Record<ComparePriceArrangement, string> = {
  stacked: 'On top of each other',
  inline: 'Next to each other',
};

export const QR_DATA_TYPE_LABELS: Record<QrDataType, string> = {
  sku: 'SKU',
  internalId: 'Internal ID',
  productUrl: 'Product URL',
  custom: 'Custom',
};

export interface CommonLabelSize {
  name: string;
  widthMm: number;
  heightMm: number;
}

export const COMMON_LABEL_SIZES: CommonLabelSize[] = [
  { name: '58×40mm (Thermal Small)', widthMm: 58, heightMm: 40 },
  { name: '80×50mm (Thermal Medium)', widthMm: 80, heightMm: 50 },
  { name: '100×50mm (Thermal Wide)', widthMm: 100, heightMm: 50 },
  { name: '100×150mm (Shipping)', widthMm: 100, heightMm: 150 },
  { name: 'A4 Label Sheet', widthMm: 210, heightMm: 297 },
];

export const generateLabelId = (): string => `lbl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const isBarcodeLike = (type: LabelElementType): boolean => type === 'barcode' || type === 'qrCode';

export const validateBarcodeData = (symbology: BarcodeSymbology, data: string): string | null => {
  if (!data) return 'Barcode data is empty';
  const fixed = (length: number, name: string): string | null => {
    if (!/^\d+$/.test(data)) return `${name} must contain only digits`;
    if (data.length !== length) return `${name} must be exactly ${length} digits`;
    return null;
  };
  switch (symbology) {
    case 'ean8':
      return fixed(8, 'EAN-8');
    case 'ean13':
      return fixed(13, 'EAN-13');
    case 'upcA':
      return fixed(12, 'UPC-A');
    case 'upcE':
      return fixed(8, 'UPC-E');
    default:
      return null;
  }
};

export const createElement = (type: LabelElementType, overrides: Partial<LabelElement> = {}): LabelElement => ({
  id: generateLabelId(),
  type,
  xMm: 5,
  yMm: 5,
  widthMm: 40,
  heightMm: isBarcodeLike(type) ? 18 : 10,
  fontSize: 10,
  fontBold: false,
  alignment: type === 'barcode' || type === 'qrCode' ? 'center' : 'left',
  verticalAlign: 'middle',
  autoFit: true,
  minFontSize: 5,
  lineHeight: 1.15,
  maxLines: 0,
  rotation: 0,
  visible: true,
  value: null,
  barcodeSymbology: type === 'barcode' ? 'code128' : undefined,
  qrDataType: type === 'qrCode' ? 'sku' : undefined,
  ...overrides,
});

export const cloneTemplate = (template: LabelTemplate): LabelTemplate => ({
  ...normalizeLabelTemplate(template),
  elements: template.elements.map(e => ({ ...e })),
  directPrint: template.directPrint ? { ...template.directPrint } : null,
});

export const duplicateTemplate = (template: LabelTemplate, newName: string): LabelTemplate => {
  const now = new Date().toISOString();
  return {
    ...normalizeLabelTemplate(template),
    id: generateLabelId(),
    name: newName.trim(),
    isDefault: false,
    isActive: true,
    elements: template.elements.map(e => ({ ...e, id: generateLabelId() })),
    directPrint: template.directPrint ? { ...template.directPrint } : null,
    createdAt: now,
    updatedAt: now,
  };
};

export const paperNameFor = (template: LabelTemplate): string => {
  for (const size of COMMON_LABEL_SIZES) {
    if (Math.abs(size.widthMm - template.widthMm) < 0.5 && Math.abs(size.heightMm - template.heightMm) < 0.5) {
      const parenStart = size.name.indexOf('(');
      if (parenStart > 0) return size.name.slice(parenStart + 1, size.name.length - 1).trim();
    }
  }
  if (template.widthMm <= 80 && template.heightMm <= 60) return 'Thermal Label';
  if (template.widthMm >= 100 && template.heightMm >= 100) return 'Shipping Label';
  return 'Custom Size';
};
