import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { OnAccountBalanceType } from 'app/shared/model/on-account-settings.model';

export interface CustomerOnAccountPaydownValidation {
  effectiveBalanceType: OnAccountBalanceType;
  payableBalance: number;
  canProceed: boolean;
  validationMessage: string | null;
}

export const getCustomerOnAccountPaydownValidation = ({
  customer,
}: {
  customer?: ICustomer | null;
}): CustomerOnAccountPaydownValidation => {
  const effectiveBalanceType = customer?.onAccountBalanceType ?? OnAccountBalanceType.BY_BRANCH;

  if (!customer?.id) {
    return {
      effectiveBalanceType,
      payableBalance: 0,
      canProceed: false,
      validationMessage: 'A customer is required before paying on account.',
    };
  }

  if (customer.onAccountEnabled !== true) {
    return {
      effectiveBalanceType,
      payableBalance: 0,
      canProceed: false,
      validationMessage: 'This customer is not enabled for on account payments.',
    };
  }

  const generalPayableBalance = Math.max(0, customer.onAccountDebitUsed ?? 0);

  if (generalPayableBalance > 0 || effectiveBalanceType === OnAccountBalanceType.BY_BUSINESS) {
    const payableBalance = generalPayableBalance;

    return {
      effectiveBalanceType,
      payableBalance,
      canProceed: payableBalance > 0,
      validationMessage: payableBalance > 0 ? null : 'This customer does not have an on account balance to pay.',
    };
  }

  const payableBalance = Math.max(
    0,
    Object.values(customer.branchOnAccountDebits || {}).reduce((sum, branchAccount) => sum + (branchAccount?.debitUsed ?? 0), 0)
  );

  return {
    effectiveBalanceType,
    payableBalance,
    canProceed: payableBalance > 0,
    validationMessage: payableBalance > 0 ? null : 'This customer does not have an on account balance to pay.',
  };
};
