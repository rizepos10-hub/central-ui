export enum PurchaseOrderSuggestedQuantitySource {
  RESTOCK = 'RESTOCK',
  SALES_ORDER_COUNT = 'SALES_ORDER_COUNT',
}

export enum PurchaseOrderSalesHistoryWindow {
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
}

export interface IPurchaseOrderQuantitySuggestionSettings {
  purchaseOrderSuggestedQuantitySource?: PurchaseOrderSuggestedQuantitySource | null;
  purchaseOrderSalesHistoryWindow?: PurchaseOrderSalesHistoryWindow | null;
}

export const defaultValue: Readonly<IPurchaseOrderQuantitySuggestionSettings> = {
  purchaseOrderSuggestedQuantitySource: PurchaseOrderSuggestedQuantitySource.RESTOCK,
  purchaseOrderSalesHistoryWindow: PurchaseOrderSalesHistoryWindow.LAST_30_DAYS,
};
