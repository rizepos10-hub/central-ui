import { getItemPriceLines, getItemTaxProfileNames } from './item-list-utils';

describe('item list display values', () => {
  it('collects item and variant tax profiles without duplicates', () => {
    expect(
      getItemTaxProfileNames({
        accountingGroups: [{ id: 'tax-1', name: 'Standard VAT' }],
        variants: [
          { accountingGroups: [{ id: 'tax-1', name: 'Standard VAT' }] },
          { accountingGroups: [{ id: 'tax-2', name: 'Reduced VAT' }] },
        ],
      })
    ).toEqual(['Standard VAT', 'Reduced VAT']);
  });

  it('formats every variant price and sale price', () => {
    expect(
      getItemPriceLines({
        variants: [
          { name: 'Small', price: 10, salePrice: 8 },
          { name: 'Large', price: 15, salePrice: null },
        ],
      })
    ).toEqual(['Small: 10.00 (Sale: 8.00)', 'Large: 15.00']);
  });

  it('ignores variants without a usable price', () => {
    expect(
      getItemPriceLines({
        variants: [{ price: null }, { price: 'not-a-number' }],
      })
    ).toEqual([]);
  });
});
