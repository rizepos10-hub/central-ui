import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { IVariableItemVariant } from 'app/shared/model/ITEM/retail/variable-item.model';
import { formatVariant } from 'app/shared/util/variant-utils';
import { LabelElement, LabelTemplate, validateBarcodeData } from '../model/label-template.model';

export interface LabelDatum {
  product: IProduct;
  variant?: IVariableItemVariant;
}

export const variantKey = (productId: string, variantId?: string | null): string => `${productId}:${variantId ?? 'base'}`;

export const formatCurrency = (value?: number | null): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '$0.00';
  const normalized = Object.is(numeric, -0) ? 0 : numeric;
  const sign = normalized < 0 ? '-' : '';
  const [whole, decimal = ''] = Math.abs(normalized).toFixed(2).split('.');
  return `${sign}$${whole}.${decimal}`;
};

const resolvePrice = (variant?: IVariableItemVariant): number | null => {
  if (!variant) return null;
  const sale = variant.salePrice;
  const base = variant.price;
  if (sale !== undefined && sale !== null) return Number(sale);
  if (base !== undefined && base !== null) return Number(base);
  return null;
};

export interface PriceParts {
  current: string;
  original?: string;
  onSale: boolean;
}

export const resolvePriceParts = (variant?: IVariableItemVariant): PriceParts => {
  const base = variant?.price;
  const sale = variant?.salePrice;
  const baseN = base === undefined || base === null ? null : Number(base);
  const saleN = sale === undefined || sale === null ? null : Number(sale);
  const onSale = saleN !== null && baseN !== null && Number.isFinite(saleN) && Number.isFinite(baseN) && saleN < baseN;
  const currentN = saleN ?? baseN;
  return {
    current: currentN === null ? '' : formatCurrency(currentN),
    original: onSale ? formatCurrency(baseN) : undefined,
    onSale,
  };
};

export const resolveBarcodeData = (datum: LabelDatum): string => datum.variant?.sku ?? '';

export const resolveQrData = (element: LabelElement, datum: LabelDatum): string => {
  const sku = datum.variant?.sku ?? '';
  switch (element.qrDataType ?? 'sku') {
    case 'internalId':
      return datum.product.id ?? '';
    case 'productUrl':
      return `/products/${datum.product.id ?? ''}`;
    case 'custom':
      return element.value ?? sku;
    case 'sku':
    default:
      return sku;
  }
};

export const resolveProductImage = (datum: LabelDatum): string | null =>
  datum.product.attachments?.[0]?.url ?? datum.product.attachments?.[0]?.path ?? datum.product.brand?.logo?.url ?? null;

export const resolveElementText = (element: LabelElement, datum: LabelDatum, useFormattedVariantName = true): string => {
  const { product, variant } = datum;
  switch (element.type) {
    case 'productName': {
      const raw = variant?.name || product.name || '';
      if (useFormattedVariantName && variant) return formatVariant(raw, variant.attributeValues) || raw;
      return raw;
    }
    case 'sku':
      return variant?.sku ?? '';
    case 'price': {
      const price = resolvePrice(variant);
      return price === null ? '' : formatCurrency(price);
    }
    case 'category':
      return product.categories?.[0]?.name ?? '';
    case 'brand':
      return product.brand?.name ?? '';
    case 'description':
      return variant?.description || product.desc || '';
    case 'customText':
      return element.value ?? '';
    case 'logo':
      return '';
    default:
      return '';
  }
};

export const elementPlaceholder = (element: LabelElement): string => {
  switch (element.type) {
    case 'productName':
      return 'Product Name';
    case 'sku':
      return 'SKU-001';
    case 'price':
      return '$0.00';
    case 'category':
      return 'Category';
    case 'brand':
      return 'Brand';
    case 'description':
      return 'Product description goes here';
    case 'customText':
      return element.value || 'Custom Text';
    case 'logo':
      return 'LOGO';
    default:
      return '';
  }
};

const DEMO_BARCODE: Record<string, string> = {
  ean8: '96385074',
  ean13: '5901234123457',
  upcA: '012345678905',
  upcE: '01234565',
  code39: 'PROD-12345',
  code128: '1234567890',
};

export const demoBarcodeData = (symbology = 'code128'): string => DEMO_BARCODE[symbology] ?? '1234567890';

export const labelHasResolvableData = (datum: LabelDatum): boolean => Boolean(datum.variant?.sku || datum.product.name);

export interface LabelBarcodeIssue {
  productName: string;
  message: string;
}

export const findLabelBarcodeIssues = (template: LabelTemplate, data: LabelDatum[]): LabelBarcodeIssue[] => {
  const issues: LabelBarcodeIssue[] = [];
  const seen = new Set<string>();
  const add = (productName: string, message: string) => {
    const key = `${productName}::${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    issues.push({ productName, message });
  };

  for (const datum of data) {
    const name = datum.product.name || datum.variant?.name || 'Unnamed product';
    for (const element of template.elements) {
      if (!element.visible) continue;
      if (element.type === 'barcode') {
        const symbology = element.barcodeSymbology ?? 'code128';
        const value = resolveBarcodeData(datum);
        const error = value ? validateBarcodeData(symbology, value) : 'has no SKU for its barcode';
        if (error) add(name, value ? error : 'has no SKU for its barcode');
      } else if (element.type === 'qrCode') {
        if (!resolveQrData(element, datum)) add(name, 'has no value for its QR code');
      }
    }
  }

  return issues;
};

export const SAMPLE_DATUM: LabelDatum = {
  product: {
    id: 'sample-product',
    name: 'Forest Air 8,000 BTU Quiet Inverter Smart Window Air Conditioner',
    desc: 'Cools spaces up to 32.52 sq. m (350 sq. ft.) with Wi-Fi and voice control.',
    categories: [{ id: 'sample-cat', name: 'Appliances' }],
    brand: { id: 'sample-brand', name: 'Forest Air' },
    attachments: [],
  } as unknown as IProduct,
  variant: {
    id: 'sample-variant',
    name: 'Forest Air 8,000 BTU Quiet Inverter Smart Window Air Conditioner',
    sku: '5901234123457',
    price: 329.99,
    salePrice: 299.99,
    attributeValues: {},
  } as unknown as IVariableItemVariant,
};
