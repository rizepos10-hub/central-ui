export interface IAmountQuantitySection<T> {
  rows: T[];
  totalAmount?: number | null;
  totalQuantity?: number | null;
}

export interface IAmountOnlySection<T> {
  rows: T[];
  totalAmount?: number | null;
}

export interface IExemptedSalesTaxSection {
  rows: never[];
  totalTaxExemptSales?: number | null;
}

export interface ICashierNegativeRow {
  field?: string;
  amount?: number | null;
  quantity?: number | null;
}

export interface IDiscountTypeRow {
  discountType?: string;
  amount?: number | null;
  quantity?: number | null;
}

export interface ICollectedSalesTaxRow {
  taxCode?: string;
  amount?: number | null;
  taxableSales?: number | null;
}

export interface ITypeAmountQuantityRow {
  type?: string;
  amount?: number | null;
  quantity?: number | null;
}

export interface ITotalSalesSection {
  grossSalesWithTax?: number | null;
  grossSalesWithTaxQuantity?: number | null;
  negativeTotal?: number | null;
  itemDiscountTotal?: number | null;
  itemDiscountTotalQuantity?: number | null;
  subtotalDiscountTotal?: number | null;
  subtotalDiscountTotalQuantity?: number | null;
  netSalesWithTax?: number | null;
  totalTaxCollected?: number | null;
  netSalesNoTax?: number | null;
  averageSale?: number | null;
}

export interface ISalesActivitySummaryReport {
  cashierNegative?: IAmountQuantitySection<ICashierNegativeRow>;
  lineItemDiscount?: IAmountQuantitySection<IDiscountTypeRow>;
  subtotalDiscount?: IAmountQuantitySection<IDiscountTypeRow>;
  collectedSalesTax?: IAmountOnlySection<ICollectedSalesTaxRow>;
  exemptedSalesTax?: IExemptedSalesTaxSection;
  creditCardBreakdown?: IAmountQuantitySection<ITypeAmountQuantityRow>;
  houseCharge?: IAmountQuantitySection<ITypeAmountQuantityRow>;
  departmentNetSales?: IAmountQuantitySection<ITypeAmountQuantityRow>;
  paidOut?: IAmountQuantitySection<ITypeAmountQuantityRow>;
  paidIn?: IAmountQuantitySection<ITypeAmountQuantityRow>;
  giftCard?: IAmountQuantitySection<ITypeAmountQuantityRow>;
  totalSalesSection?: ITotalSalesSection;
}
