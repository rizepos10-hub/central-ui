export interface IStockAtLocationSummary {
  quantity?: number;
  minimumStockLevel?: number;
}

export interface IPurchaseOrderOrderableItem {
  itemId?: string;
  itemName?: string;
  variantId?: string;
  variantName?: string;
  supplierPrice?: number | null;
  supplierCode?: string | null;
  defaultPrice?: number | null;
  minOrderQuantity?: number | null;
  stockAtLocation?: IStockAtLocationSummary | null;
}

export const defaultValue: Readonly<IPurchaseOrderOrderableItem> = {};
