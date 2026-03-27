import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { OnAccountBalanceType } from 'app/shared/model/on-account-settings.model';

interface GetOnAccountPaymentValidationParams {
  customer?: ICustomer | null;
  orderBranchId?: string | null;
  paymentAmount?: number;
  onAccountBalanceType?: OnAccountBalanceType | null;
}

export interface OnAccountPaymentValidation {
  effectiveBalanceType: OnAccountBalanceType;
  accountBalance: number;
  accountLimit: number;
  accountRemaining: number;
  accountBalanceAfterPayment: number;
  accountRemainingAfterPayment: number;
  canProceed: boolean;
  validationMessage: string | null;
}

export const getOnAccountPaymentValidation = ({
  customer,
  orderBranchId,
  paymentAmount = 0,
  onAccountBalanceType,
}: GetOnAccountPaymentValidationParams): OnAccountPaymentValidation => {
  const normalizedPaymentAmount = Math.max(0, paymentAmount);
  const effectiveBalanceType = customer?.onAccountBalanceType ?? onAccountBalanceType ?? OnAccountBalanceType.BY_BRANCH;

  if (!customer?.id) {
    return {
      effectiveBalanceType,
      accountBalance: 0,
      accountLimit: 0,
      accountRemaining: 0,
      accountBalanceAfterPayment: normalizedPaymentAmount,
      accountRemainingAfterPayment: -normalizedPaymentAmount,
      canProceed: false,
      validationMessage: 'A customer is required for on account payments.',
    };
  }

  if (customer.onAccountEnabled !== true) {
    return {
      effectiveBalanceType,
      accountBalance: 0,
      accountLimit: 0,
      accountRemaining: 0,
      accountBalanceAfterPayment: normalizedPaymentAmount,
      accountRemainingAfterPayment: -normalizedPaymentAmount,
      canProceed: false,
      validationMessage: 'This customer is not enabled for on account payments.',
    };
  }

  if (effectiveBalanceType === OnAccountBalanceType.BY_BUSINESS) {
    const accountBalance = customer.onAccountDebitUsed ?? 0;
    const accountLimit = customer.onAccountDebitLimit ?? 0;
    const accountRemaining = accountLimit - accountBalance;
    const accountBalanceAfterPayment = accountBalance + normalizedPaymentAmount;
    const accountRemainingAfterPayment = accountLimit - accountBalanceAfterPayment;

    return {
      effectiveBalanceType,
      accountBalance,
      accountLimit,
      accountRemaining,
      accountBalanceAfterPayment,
      accountRemainingAfterPayment,
      canProceed: accountBalanceAfterPayment <= accountLimit,
      validationMessage:
        accountBalanceAfterPayment > accountLimit ? 'This payment would exceed the customer account limit.' : null,
    };
  }

  if (!orderBranchId) {
    return {
      effectiveBalanceType,
      accountBalance: 0,
      accountLimit: 0,
      accountRemaining: 0,
      accountBalanceAfterPayment: normalizedPaymentAmount,
      accountRemainingAfterPayment: -normalizedPaymentAmount,
      canProceed: false,
      validationMessage: 'This order does not have a branch, so branch on account validation cannot be completed.',
    };
  }

  const branchAccount = customer.branchOnAccountDebits?.[orderBranchId];

  if (!branchAccount) {
    return {
      effectiveBalanceType,
      accountBalance: 0,
      accountLimit: 0,
      accountRemaining: 0,
      accountBalanceAfterPayment: normalizedPaymentAmount, 
      accountRemainingAfterPayment: -normalizedPaymentAmount,
      canProceed: false,
      validationMessage: 'This customer does not have on account settings for the selected branch.',
    };
  }

  const accountBalance = branchAccount.debitUsed ?? 0;
  const accountLimit = branchAccount.debitLimit ?? 0;
  const accountRemaining = accountLimit - accountBalance;
  const accountBalanceAfterPayment = accountBalance + normalizedPaymentAmount;
  const accountRemainingAfterPayment = accountLimit - accountBalanceAfterPayment;

  return {
    effectiveBalanceType,
    accountBalance,
    accountLimit,
    accountRemaining,
    accountBalanceAfterPayment,
    accountRemainingAfterPayment,
    canProceed: accountBalanceAfterPayment <= accountLimit,
    validationMessage:
      accountBalanceAfterPayment > accountLimit ? 'This payment would exceed the customer account limit.' : null,
  };
};
