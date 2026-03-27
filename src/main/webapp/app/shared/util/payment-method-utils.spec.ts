import { formatTransactionMethodLabel } from './payment-method-utils';

describe('payment method utils', () => {
  it('formats camelCase transaction methods', () => {
    expect(formatTransactionMethodLabel('creditCard')).toBe('Credit Card');
    expect(formatTransactionMethodLabel('onAccount')).toBe('On Account');
  });

  it('formats underscore-separated transaction methods', () => {
    expect(formatTransactionMethodLabel('gift_card')).toBe('Gift Card');
  });

  it('returns a fallback for empty values', () => {
    expect(formatTransactionMethodLabel('')).toBe('-');
    expect(formatTransactionMethodLabel(undefined)).toBe('-');
    expect(formatTransactionMethodLabel(null)).toBe('-');
  });
});
