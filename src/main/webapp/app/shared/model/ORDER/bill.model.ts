import { IPaymentTransaction } from 'app/shared/model/ORDER/payment-transaction.model';
import { IBilledItem } from 'app/shared/model/ORDER/billed-items.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';

export interface IBill extends IOrderAudit {
  id?: string;
  dateTime?: string;
  billItems?: IBilledItem[];
  payee?: string;
  paymentTransactions?: IPaymentTransaction[];
}

export const defaultValue: Readonly<IBill> = {};
