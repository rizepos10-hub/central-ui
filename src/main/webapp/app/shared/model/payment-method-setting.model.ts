import { TransactionMethodEnum } from './service-charge.model';

export interface IPaymentMethodSetting {
  id?: string;
  transactionMethod?: TransactionMethodEnum | string;
  name?: string;
  show?: boolean;
  order?: number | null;
}

export const defaultValue: Readonly<IPaymentMethodSetting> = {};
