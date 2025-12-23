export interface ICashPayment {
  id?: string;
  payoutType?: string;
  note?: string;
  paymentType?: string | null;
  amount?: number;
  username?: string;
  tillId?: string;
  branchId?: string;
  date?: string;
  direction?: string;
}

export const defaultValue: Readonly<ICashPayment> = {};
