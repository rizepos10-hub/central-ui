/**
 * Target column names accepted by central CsvFileServiceImpl / CSVHeaders.
 * Includes numbered variants for paired/grouped headers.
 */

function expandNumberedGroups(): string[] {
  const extra: string[] = [];
  for (let i = 1; i <= 3; i++) {
    extra.push(`CUSTOM_FIELD_KEY_${i}`, `CUSTOM_FIELD_VALUE_${i}`);
    extra.push(`ATTRIBUTE_NAME_${i}`, `ATTRIBUTE_VALUES_${i}`);
    extra.push(
      `WAREHOUSE_REFERENCE_${i}`,
      `WAREHOUSE_QUANTITY_${i}`,
      `WAREHOUSE_RESTOCK_QUANTITY_${i}`,
      `WAREHOUSE_COST_PRICE_${i}`
    );
    extra.push(`ADDON_NAME_${i}`, `ADDON_DESCRIPTION_${i}`, `ADDON_PRICE_${i}`, `ADDON_TAX_${i}`);
  }
  return extra;
}

const FLAT_FIELDS: string[] = [
  'SKU',
  'NAME',
  'PRICE',
  'SALE_PRICE',
  'ASK_FOR_PRICE',
  'DESCRIPTION',
  'IMAGE',
  'ADDRESS',
  'EMAIL',
  'SUPPLIER',
  'SUPPLIER_CODE',
  'PHONE',
  'ITEM_TYPE',
  'UNIT_OF_MEASURE',
  'CATEGORIES',
  'VISIBLE_ONLINE',
  'VISIBLE_POS',
  'EXCLUDE_FROM_LOYALTY_PROGRAM',
  'WEIGHT',
  'LENGTH',
  'WIDTH',
  'HEIGHT',
  'SELL_BY_WEIGHT',
  'ARCHIVED',
  'TAX',
  'PARENT',
  'ID',
  'VARIANT_ID',
  'ADDON_GROUPS',
  'TAG',
  'BRAND',
  'SUPPLIER_PRICE',
  'SUPPLIER_MIN_ORDER_QUANTITY',
];

/** All mappable system column headers (order: flat core fields, then grouped numbered fields). */
export const CATALOG_IMPORT_SYSTEM_FIELDS: string[] = [...FLAT_FIELDS, ...expandNumberedGroups()];

export const CATALOG_IMPORT_REQUIRED_FIELDS = ['ITEM_TYPE', 'NAME'] as const;
