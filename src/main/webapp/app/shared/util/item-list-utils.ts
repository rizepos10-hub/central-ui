import { IItem } from 'app/shared/model/ITEM/item.model';
import { formatVariant } from './variant-utils';

type ItemListVariant = {
  name?: string | null;
  attributeValues?: Record<string, { name?: string | null }> | null;
  price?: number | string | null;
  salePrice?: number | string | null;
  accountingGroups?: Array<{ id?: string | null; name?: string | null }> | null;
};

const getVariants = (item?: Pick<IItem, 'variants'> | null): ItemListVariant[] =>
  Array.isArray(item?.variants) ? (item.variants as ItemListVariant[]) : [];

export const getItemTaxProfileNames = (item?: Pick<IItem, 'accountingGroups' | 'variants'> | null): string[] => {
  const groups = [...(item?.accountingGroups || []), ...getVariants(item).flatMap(variant => variant.accountingGroups || [])];
  const seen = new Set<string>();

  return groups.reduce<string[]>((names, group) => {
    const name = group?.name?.trim();
    if (!name) {
      return names;
    }

    const key = group.id || name;
    if (!seen.has(key)) {
      seen.add(key);
      names.push(name);
    }

    return names;
  }, []);
};

const formatPrice = (value?: number | string | null): string | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : null;
};

export const getItemPriceLines = (item?: Pick<IItem, 'variants'> | null): string[] => {
  const variants = getVariants(item);

  return variants.reduce<string[]>((lines, variant, index) => {
    const price = formatPrice(variant.price);
    const salePrice = formatPrice(variant.salePrice);
    if (!price && !salePrice) {
      return lines;
    }

    const priceText = price && salePrice && price !== salePrice ? `${price} (Sale: ${salePrice})` : salePrice || price;
    const variantName = variants.length > 1 ? formatVariant(variant.name, variant.attributeValues).trim() || `Variant ${index + 1}` : '';

    lines.push(variantName ? `${variantName}: ${priceText}` : priceText);
    return lines;
  }, []);
};
