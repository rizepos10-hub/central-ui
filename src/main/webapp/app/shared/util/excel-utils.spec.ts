import { parseSalesSummaryFromEndOfDay } from './excel-utils';

describe('parseSalesSummaryFromEndOfDay', () => {
  it('returns summary data when already at top level', () => {
    const summary = { totalSales: { grossSales: 100 }, totalReceived: [] };
    expect(parseSalesSummaryFromEndOfDay(summary)).toBe(summary);
  });

  it('parses nested report JSON string from EndOfDay entity', () => {
    const summary = { totalSales: { grossSales: 250 }, totalReceived: [{ paymentType: 'CASH', amount: 250 }] };
    const endOfDay = { id: 'eod-1', number: 42, report: JSON.stringify(summary) };

    expect(parseSalesSummaryFromEndOfDay(endOfDay)).toEqual(summary);
  });

  it('parses nested report object from EndOfDay entity', () => {
    const summary = { totalSales: { netSales: 90 } };
    expect(parseSalesSummaryFromEndOfDay({ report: summary })).toEqual(summary);
  });
});
