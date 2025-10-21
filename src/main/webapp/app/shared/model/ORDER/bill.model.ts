import { IPaymentTransaction } from 'app/shared/model/ORDER/payment-transaction.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { IOrderedItem } from './ordered-item.model';

export interface IBill extends IOrderAudit {
  id?: string;
  billId?: string;
  sequenceNumber?: number;
  dateTime?: string;
  billItems?: IOrderedItem[];
  items?: IOrderedItem[];
  payee?: string;
  paymentType?: "CASH" | "CARD";
  paymentTransactions?: IPaymentTransaction[];
  chargesShares?: {
    [key: string]: number;
  },
  total?: number | null,
  status?: BillStatus | string;
}

export enum BillStatus {
  DRAFT,
  PAID,
  CANCELED,
  REFUNDED,
  REFUND_BILL,
  REOPENED,
  VOIDED,
  VOID_BILL
}

export const defaultValue: Readonly<IBill> = {
  id: '',
  billItems: [],
  items: [],
  paymentTransactions: [],
  chargesShares: {},
  total: null,
  payee: '',
};
