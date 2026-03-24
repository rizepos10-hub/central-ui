import { omitGlobalOnAccountFields } from './customer-on-account.utils';

describe('customer on-account utils', () => {
  it('omits global on-account fields from the customer payload', () => {
    const result = omitGlobalOnAccountFields({
      id: 'customer-1',
      firstName: 'Ada',
      onAccountEnabled: true,
      onAccountDebitUsed: 5,
      onAccountBalanceType: 'BY_BRANCH' as any,
      onAccountDebitLimit: 100,
      branchOnAccountDebits: {
        'branch-1': { debitLimit: 50, debitUsed: 15 },
      },
    });

    expect(result).toMatchObject({
      id: 'customer-1',
      firstName: 'Ada',
      onAccountEnabled: true,
      onAccountDebitUsed: 5,
    });
    expect(result.onAccountBalanceType).toBeUndefined();
    expect(result.onAccountDebitLimit).toBeUndefined();
    expect(result.branchOnAccountDebits).toBeUndefined();
  });
});
