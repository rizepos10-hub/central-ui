export interface IBranchOnAccountDebit {
  debitLimit?: number | null;
  debitUsed?: number | null;
}

export interface IBranchOnAccountDebitMap {
  [key: string]: IBranchOnAccountDebit;
}

export enum OnAccountBalanceType {
  BY_BUSINESS = 'BY_BUSINESS',
  BY_BRANCH = 'BY_BRANCH',
}

export interface IOnAccountSettings {
  onAccountBalanceType?: OnAccountBalanceType | null;
  onAccountDebitLimit?: number | null;
  branchOnAccountDebits?: IBranchOnAccountDebitMap;
  warningThreshold?: number | null;
  criticalThreshold?: number | null;
}

export const defaultValue: Readonly<IOnAccountSettings> = {
  onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
  onAccountDebitLimit: 0,
  branchOnAccountDebits: {},
  warningThreshold: 0,
  criticalThreshold: 0,
};
