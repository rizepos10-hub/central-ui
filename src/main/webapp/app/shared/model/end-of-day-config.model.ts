export type EndOfDaySection =
  | 'SALES'
  | 'PAYMENTS'
  | 'CASH_SALES'
  | 'GROSS_SALES'
  | 'CATEGORY_SALES'
  | 'STATISTICS'
  | 'TIPS_OUT'
  | 'ORDER_METHODS'
  | 'TENDER_SUMMARY'
  | 'TENDER_RECONCILIATION'
  | 'SALES_SUMMARY'
  | 'SALES_BY_TAX'
  | 'SALES_BY_CATEGORY'
  | 'SALES_BY_TAG'
  | 'SALES_BY_PRICING_POINT'
  | 'SALES_BY_ORDER_TYPE'
  | 'SALES_BY_STATION'
  | 'SALES_BY_ITEM'
  | 'SALES_BY_EMPLOYEE'
  | 'DELIVERY_PERFORMANCE'
  | 'SERVICE_CHARGE_SUMMARY'
  | 'PAYOUT_SUMMARY'
  | 'DRIVER_FEES_SUMMARY'
  | 'VOIDED_TICKETS'
  | 'HOURLY_SALES_SUMMARY'
  | 'NEW_CUSTOMERS'
  | 'DISCOUNT_DETAILS'
  | 'COUPON_DETAILS'
  | 'DEPOSIT_SUMMARY'
  | 'DEPOSIT_DETAILS';

export interface IEndOfDayConfig {
  endingType?: 'END_OF_DAY' | 'END_OF_TILL';
  startDate?: string;
  defaultEndDate?: string;
  canDeleteOrders?: boolean;
  defaultSelectedSections?: EndOfDaySection[];
}

export const defaultValue: Readonly<IEndOfDayConfig> = {
  endingType: 'END_OF_DAY',
  startDate: '',
  defaultEndDate: '',
  canDeleteOrders: false,
  defaultSelectedSections: []
};
