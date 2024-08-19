import { IPaymentTransaction } from 'app/shared/model/ORDER/payment-transaction.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { IOrderedItem } from './ordered-item.model';

export interface IBill extends IOrderAudit {
  id?: string;
  dateTime?: string;
  billItems?: IOrderedItem[];
  payee?: string;
  paymentTransactions?: IPaymentTransaction[];
}

export const defaultValue: Readonly<IBill> = {};
