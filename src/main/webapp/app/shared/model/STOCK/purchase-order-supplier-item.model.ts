export interface IPurchaseOrderSupplierItem {
  itemId?: string;
  itemName?: string;
  variantId?: string;
  variantName?: string;
  supplierPrice?: number | null;
  supplierCode?: string | null;
  defaultPrice?: number | null;
  minOrderQuantity?: number | null;
  defaultSupplier?: boolean | null;
}

export const defaultValue: Readonly<IPurchaseOrderSupplierItem> = {};
