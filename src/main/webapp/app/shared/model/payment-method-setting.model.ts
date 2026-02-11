import { TransactionMethodEnum } from './service-charge.model';

export interface IPaymentMethodSetting {
  id?: string;
  transactionMethod?: TransactionMethodEnum | string;
  name?: string;
  show?: boolean;
}

export const defaultValue: Readonly<IPaymentMethodSetting> = {};
