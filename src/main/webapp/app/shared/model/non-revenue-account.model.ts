export type NonRevenueDirection = 'DEPOSIT' | 'WITHDRAWAL' | 'BOTH';
export type NonRevenueAmountMode = 'OPEN' | 'FIXED' | 'DENOMINATIONS';
export type NonRevenueApproval = 'NONE' | 'WITHDRAWAL' | 'OVER_LIMIT' | 'ALWAYS';
export type NonRevenueCommissionBase = 'DEPOSITS' | 'WITHDRAWALS' | 'BOTH';

export interface NonRevenueRules {
  direction: NonRevenueDirection;
  allowedPaymentMethods: string[];
  allowMixedBasket: boolean;
  movableBetweenBills: boolean;
  cashOutExcess: boolean;
  amountMode: NonRevenueAmountMode;
  fixedAmount?: number | null;
  denominations: number[];
  minAmount?: number | null;
  maxAmount?: number | null;
  requireReference: boolean;
  approval: NonRevenueApproval;
  approvalLimit?: number | null;
  ageCheck: boolean;
  minimumAge?: number | null;
  refundable: boolean;
  requireCustomer: boolean;
}

export interface NonRevenueAccount {
  id?: string;
  name: string;
  /** Printed for deposits, e.g. "Lottery". */
  receiptLabel?: string | null;
  /** Printed for withdrawals, e.g. "Lottery Paid Out". */
  withdrawalLabel?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  branchIds: string[];
  rules: NonRevenueRules;
  commissionPercent?: number | null;
  commissionAppliesTo: NonRevenueCommissionBase;
}

export const emptyRules = (): NonRevenueRules => ({
  direction: 'BOTH',
  allowedPaymentMethods: [],
  allowMixedBasket: true,
  movableBetweenBills: true,
  cashOutExcess: false,
  amountMode: 'OPEN',
  fixedAmount: null,
  denominations: [],
  minAmount: null,
  maxAmount: null,
  requireReference: false,
  approval: 'NONE',
  approvalLimit: null,
  ageCheck: false,
  minimumAge: null,
  refundable: true,
  requireCustomer: false,
});

export const emptyAccount = (): NonRevenueAccount => ({
  name: '',
  receiptLabel: '',
  withdrawalLabel: '',
  color: '',
  sortOrder: null,
  branchIds: [],
  rules: emptyRules(),
  commissionPercent: null,
  commissionAppliesTo: 'DEPOSITS',
});
