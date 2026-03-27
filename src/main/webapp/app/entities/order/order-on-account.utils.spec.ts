import { OnAccountBalanceType } from 'app/shared/model/on-account-settings.model';
import { getOnAccountPaymentValidation } from './order-on-account.utils';

describe('order on-account utils', () => {
  it('resolves business-mode balance and limit', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountDebitUsed: 40,
        onAccountDebitLimit: 100,
      },
      paymentAmount: 20,
      onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
    });

    expect(result).toMatchObject({
      effectiveBalanceType: OnAccountBalanceType.BY_BUSINESS,
      accountBalance: 40,
      accountLimit: 100,
      accountRemaining: 60,
      accountBalanceAfterPayment: 60,
      accountRemainingAfterPayment: 40,
      canProceed: true,
      validationMessage: null,
    });
  });

  it('prefers customer balance type when the customer is by business', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
        onAccountDebitUsed: 40,
        onAccountDebitLimit: 100,
        branchOnAccountDebits: {
          'branch-1': {
            debitLimit: 999,
            debitUsed: 999,
          },
        },
      },
      orderBranchId: 'branch-1',
      paymentAmount: 10,
      onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
    });

    expect(result).toMatchObject({
      effectiveBalanceType: OnAccountBalanceType.BY_BUSINESS,
      accountBalance: 40,
      accountLimit: 100,
      accountRemaining: 60,
      accountBalanceAfterPayment: 50,
      accountRemainingAfterPayment: 50,
      canProceed: true,
      validationMessage: null,
    });
  });

  it('resolves branch-mode balance and limit', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        branchOnAccountDebits: {
          'branch-1': {
            debitLimit: 80,
            debitUsed: 30,
          },
        },
      },
      orderBranchId: 'branch-1',
      paymentAmount: 20,
      onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
    });

    expect(result).toMatchObject({
      effectiveBalanceType: OnAccountBalanceType.BY_BRANCH,
      accountBalance: 30,
      accountLimit: 80,
      accountRemaining: 50,
      accountBalanceAfterPayment: 50,
      accountRemainingAfterPayment: 30,
      canProceed: true,
      validationMessage: null,
    });
  });

  it('uses payment amount only for projection', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountDebitUsed: 10,
        onAccountDebitLimit: 100,
      },
      paymentAmount: 15,
      onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
    });

    expect(result.accountBalanceAfterPayment).toBe(25);
    expect(result.accountRemainingAfterPayment).toBe(75);
  });

  it('allows payments below the limit', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountDebitUsed: 40,
        onAccountDebitLimit: 100,
      },
      paymentAmount: 30,
      onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
    });

    expect(result.canProceed).toBe(true);
    expect(result.validationMessage).toBeNull();
  });

  it('allows payments exactly at the limit', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountDebitUsed: 70,
        onAccountDebitLimit: 100,
      },
      paymentAmount: 30,
      onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
    });

    expect(result.canProceed).toBe(true);
    expect(result.accountBalanceAfterPayment).toBe(100);
    expect(result.accountRemainingAfterPayment).toBe(0);
  });

  it('blocks payments above the limit', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        onAccountDebitUsed: 80,
        onAccountDebitLimit: 100,
      },
      paymentAmount: 25,
      onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
    });

    expect(result.canProceed).toBe(false);
    expect(result.validationMessage).toBe('This payment would exceed the customer account limit.');
    expect(result.accountRemainingAfterPayment).toBe(-5);
  });

  it('blocks when customer is missing', () => {
    const result = getOnAccountPaymentValidation({
      customer: undefined,
      paymentAmount: 20,
      onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
    });

    expect(result.canProceed).toBe(false);
    expect(result.validationMessage).toBe('A customer is required for on account payments.');
  });

  it('blocks when customer is not on-account enabled', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: false,
        onAccountDebitUsed: 10,
        onAccountDebitLimit: 100,
      },
      paymentAmount: 20,
      onAccountBalanceType: OnAccountBalanceType.BY_BUSINESS,
    });

    expect(result.canProceed).toBe(false);
    expect(result.validationMessage).toBe('This customer is not enabled for on account payments.');
  });

  it('blocks when branch mode is active and branch data is missing', () => {
    const result = getOnAccountPaymentValidation({
      customer: {
        id: 'customer-1',
        onAccountEnabled: true,
        branchOnAccountDebits: {},
      },
      orderBranchId: 'branch-1',
      paymentAmount: 20,
      onAccountBalanceType: OnAccountBalanceType.BY_BRANCH,
    });

    expect(result.canProceed).toBe(false);
    expect(result.validationMessage).toBe('This customer does not have on account settings for the selected branch.');
  });
});
