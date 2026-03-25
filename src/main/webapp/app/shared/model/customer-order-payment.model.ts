import { IPaymentTransaction } from 'app/shared/model/ORDER/payment-transaction.model';

export interface ICustomerOrderPaymentTransaction extends IPaymentTransaction {
  receivedAmount?: number | null;
  tipAmount?: number | null;
  cashbackAmount?: number | null;
  changeAmount?: number | null;
  archived?: boolean | null;
}

export interface ICustomerOrderPayment {
  orderId?: string | null;
  branchId?: string | null;
  billId?: string | null;
  orderSequenceNumber?: number | null;
  payment?: ICustomerOrderPaymentTransaction | null;
}

export const defaultValue: Readonly<ICustomerOrderPayment> = {};
