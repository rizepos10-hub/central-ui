import { parseSummaryReport } from './excel-utils';
import { formatShiftOptionLabel, hasSalesActivity } from './shift-report-utils';

describe('shift report utils', () => {
  describe('parseSummaryReport', () => {
    const summary = {
      totalSales: { orders: 2, grossSales: 140, netSales: 140 },
      totalReceived: [],
    };

    it('parses a JSON string report', () => {
      expect(parseSummaryReport(JSON.stringify(summary))).toEqual(summary);
    });

    it('returns an object report as-is', () => {
      expect(parseSummaryReport(summary)).toBe(summary);
    });

    it('returns null for invalid or missing values', () => {
      expect(parseSummaryReport(null)).toBeNull();
      expect(parseSummaryReport(undefined)).toBeNull();
      expect(parseSummaryReport('not-json')).toBeNull();
      expect(parseSummaryReport({})).toBeNull();
    });
  });

  describe('hasSalesActivity', () => {
    it('returns true when orders, gross sales, or net sales are positive', () => {
      expect(hasSalesActivity({ orders: 1, grossSales: 0, netSales: 0 } as any)).toBe(true);
      expect(hasSalesActivity({ orders: 0, grossSales: 10, netSales: 0 } as any)).toBe(true);
      expect(hasSalesActivity({ orders: 0, grossSales: 0, netSales: 5 } as any)).toBe(true);
    });

    it('returns false for empty or zero summaries', () => {
      expect(hasSalesActivity(undefined)).toBe(false);
      expect(hasSalesActivity({ orders: 0, grossSales: 0, netSales: 0 } as any)).toBe(false);
    });
  });

  describe('formatShiftOptionLabel', () => {
    it('formats clock in, clock out, and duration', () => {
      const label = formatShiftOptionLabel({
        instantClockedIn: '2025-07-01T15:47:29.032Z',
        instantClockedOut: '2025-07-01T15:47:38.546Z',
      });

      expect(label).toContain('→');
      expect(label).toContain('(9s)');
    });
  });
});
