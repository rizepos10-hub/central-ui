export interface ICustomerOnAccountAudit {
  id?: string;
  customerId?: string;
  customerName?: string;
  branchId?: string;
  action?: 'DEBIT' | 'CREDIT' | string;
  amount?: number | null;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  debitLimit?: number | null;
  orderId?: string;
  note?: string;
  createdDate?: string;
  createdBy?: string;
}
