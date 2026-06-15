export interface ICustomerPayByOnAccountRequest {
  amount: number;
  branchId?: string | null;
  orderId?: string | null;
  paymentMethodName: string;
  billSequenceNumber?: number | null;
  note?: string | null;
}

export const defaultCustomerPayByOnAccountRequest: Readonly<ICustomerPayByOnAccountRequest> = {
  amount: 0,
  branchId: null,
  orderId: null,
  paymentMethodName: '',
  billSequenceNumber: null,
  note: null,
};
