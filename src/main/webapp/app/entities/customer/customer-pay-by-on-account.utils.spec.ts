import { OnAccountBalanceType } from 'app/shared/model/on-account-settings.model';
import { getCustomerOnAccountPaydownValidation } from './customer-pay-by-on-account.utils';

describe('getCustomerOnAccountPaydownValidation', () => {
  it('uses business balance when customer is BY_BUSINESS', () => {
    const result = getCustomerOnAccountPaydownValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
        onAccountDebitUsed: 125,
      },
    });

    expect(result.payableBalance).toBe(125);
    expect(result.canProceed).toBe(true);
    expect(result.validationMessage).toBeNull();
  });

  it('uses selected branch balance when customer is BY_BRANCH', () => {
    const result = getCustomerOnAccountPaydownValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
        branchOnAccountDebits: {
          'branch-1': {
            debitLimit: 500,
            debitUsed: 75,
          },
          'branch-2': {
            debitLimit: 250,
            debitUsed: 25,
          },
        },
      },
    });

    expect(result.payableBalance).toBe(100);
    expect(result.canProceed).toBe(true);
    expect(result.validationMessage).toBeNull();
  });

  it('blocks when there is no branch or business payable balance', () => {
    const result = getCustomerOnAccountPaydownValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
        branchOnAccountDebits: {},
      },
    });

    expect(result.payableBalance).toBe(0);
    expect(result.canProceed).toBe(false);
    expect(result.validationMessage).toContain('does not have an on account balance');
  });
});
