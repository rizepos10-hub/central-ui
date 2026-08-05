export const normalizeSkuList = (skus?: Array<string | null | undefined> | null): string[] =>
  Array.from(
    new Set(
      (skus ?? [])
        .map(sku => sku?.trim() ?? '')
        .filter(Boolean)
    )
  );

export const parseSkuInput = (value?: string | null): string[] =>
  normalizeSkuList((value ?? '').split(','));

export const getPrimarySku = (variant?: { skus?: Array<string | null | undefined> | null } | null): string | null =>
  normalizeSkuList(variant?.skus).at(0) ?? null;

export const getVariantSkus = (variant?: { skus?: Array<string | null | undefined> | null } | null): string[] =>
  normalizeSkuList(variant?.skus);

export const formatSkuList = (variant?: { skus?: Array<string | null | undefined> | null } | null): string =>
  getVariantSkus(variant).join(', ');
