import { TransactionType } from 'app/shared/model/ENUMS/transaction-type.model';
import { TransactionMethod } from 'app/shared/model/ENUMS/transaction-method.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';

export interface IPaymentTransaction extends IOrderAudit {
  id?: string;
  amount?: number;
  description?: string;
  dateTime?: string;
  type?: TransactionType | string;
  method?: IPaymentMethodSetting;
  status?: string;
}

export interface IPaymentMethodSetting {
  id?: string;
  transactionMethod?: TransactionMethod;
  name?: string;
  show?: boolean;
}

export const defaultValue: Readonly<IPaymentTransaction> = {};
