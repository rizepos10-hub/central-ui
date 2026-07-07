import type { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';

export type LoyaltyPointHistoryEventType =
  | 'CREATED'
  | 'ORDER_EARNED'
  | 'ORDER_REVERSED'
  | 'LOYALTY_REDEEMED'
  | 'MANUAL_SET'
  | 'MANUAL_INCREMENT'
  | 'MANUAL_DECREMENT';

export interface ILoyaltyPointHistory {
  id?: string;
  customerPointId?: string;
  customerId?: string;
  customer?: ICustomer | null;
  eventType?: LoyaltyPointHistoryEventType;
  pointsDelta?: number | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  cashBasis?: number | null;
  orderId?: string | null;
  note?: string | null;
  createdDate?: string;
  createdBy?: string | null;
}
