import { IPaymentTransaction } from 'app/shared/model/payment-transaction.model';
import { IBilledItem } from 'app/shared/model/billed-items.model';
import { IOrderAudit } from 'app/shared/model/order-audit.model';

export interface IBill extends IOrderAudit {
  id?: string;
  dateTime?: string;
  billItems?: IBilledItem[];
  payee?: string;
  paymentTransactions?: IPaymentTransaction[];
}

export const defaultValue: Readonly<IBill> = {};
