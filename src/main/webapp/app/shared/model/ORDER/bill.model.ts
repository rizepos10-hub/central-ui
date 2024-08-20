import { IPaymentTransaction } from 'app/shared/model/ORDER/payment-transaction.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { IOrderedItem } from './ordered-item.model';

export interface IBill extends IOrderAudit {
  id?: string;
  billId?: string;
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
