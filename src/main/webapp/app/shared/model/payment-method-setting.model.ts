import { TransactionMethodEnum } from './service-charge.model';

export interface IPaymentMethodSetting {
  id?: string;
  transactionMethod?: TransactionMethodEnum | string;
  name?: string;
  show?: boolean;
  order?: number | null;
  hiddenInApps?: PaymentMethodApp[] | null;
}

export type PaymentMethodApp = 'DESKTOP_POS' | 'MOBILE_POS';

export const defaultValue: Readonly<IPaymentMethodSetting> = {};
