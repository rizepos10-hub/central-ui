export interface IOptimizedProductSalesRow {
  itemId?: string;
  receiptAlias?: string;
  quantity?: number | null;
  quantityPercent?: number | null;
  extCost?: number | null;
  sales?: number | null;
  margin?: number | null;
  marginPercent?: number | null;
}

export interface IOptimizedProductSalesReport {
  items: IOptimizedProductSalesRow[];
  totalQuantity?: number | null;
  totalSales?: number | null;
  totalExtCost?: number | null;
  totalMargin?: number | null;
}
