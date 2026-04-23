import { buildSalesReportViewModel } from './sales-report-view-model';

const sampleReport = {
  headerSlots: [
    { order: 1, label: '2022' },
    { order: 2, label: '2023' },
    { order: 3, label: '2024' },
    { order: 4, label: '2025' },
    { order: 5, label: '2026' },
  ],
  rows: [
    {
      rowRecord: { id: 'row-1', name: 'Espresso' },
      slots: [
        { order: 1, value: 10 },
        { order: 2, value: 12 },
        { order: 3, value: 14 },
        { order: 4, value: 16 },
        { order: 5, value: 18 },
      ],
      value: 70,
      revenue: 70,
      costOfGoods: 21,
      grossProfit: 49,
      margin: 49,
      tax: 7,
      taxes: {
        tax_GST_TEST: 2.1,
        tax_PST_TEST: 4.9,
      },
      returns: 2,
    },
  ],
  totalByDateRange: {
    year1: {
      value: 100,
      revenue: 100,
      costOfGoods: 30,
      grossProfit: 70,
      margin: 70,
      tax: 10,
      taxes: { tax_GST_TEST: 3, tax_PST_TEST: 7 },
      returns: 1,
    },
    year2: {
      value: 110,
      revenue: 110,
      costOfGoods: 35,
      grossProfit: 75,
      margin: 75,
      tax: 11,
      taxes: { tax_GST_TEST: 3.3, tax_PST_TEST: 7.7 },
      returns: 2,
    },
    year3: {
      value: 120,
      revenue: 120,
      costOfGoods: 38,
      grossProfit: 82,
      margin: 82,
      tax: 12,
      taxes: { tax_GST_TEST: 3.6, tax_PST_TEST: 8.4 },
      returns: 3,
    },
    year4: {
      value: 130,
      revenue: 130,
      costOfGoods: 42,
      grossProfit: 88,
      margin: 88,
      tax: 13,
      taxes: { tax_GST_TEST: 3.9, tax_PST_TEST: 9.1 },
      returns: 4,
    },
    year5: {
      value: 140,
      revenue: 140,
      costOfGoods: 45,
      grossProfit: 95,
      margin: 95,
      tax: 14,
      taxes: { tax_GST_TEST: 4.2, tax_PST_TEST: 9.8, tax_HST_ONLY: 1.5 },
      returns: 5,
    },
  },
};

describe('sales-report-view-model', () => {
  it('groups export columns into chunks of four and keeps totals aligned by period', () => {
    const model = buildSalesReportViewModel({
      report: sampleReport,
      labelColumnTitle: 'Product',
      selectedMeasure: 'REVENUE',
      selectedMeasureLabel: 'Revenue',
    });

    expect(model.metricColumns.map(column => column.key)).toEqual([
      'total',
      'costOfGoods',
      'grossProfit',
      'margin',
      'tax',
      'tax_GST_TEST',
      'tax_PST_TEST',
      'tax_HST_ONLY',
      'returns',
    ]);
    expect(model.rows[0].metricValues).toMatchObject({
      tax_GST_TEST: 2.1,
      tax_PST_TEST: 4.9,
      tax_HST_ONLY: null,
      returns: 2,
    });
    expect(model.exportGroups).toHaveLength(2);
    expect(model.exportGroups[0].periodColumns.map(column => column.label)).toEqual(['2022', '2023', '2024', '2025']);
    expect(model.exportGroups[1].periodColumns.map(column => column.label)).toEqual(['2026']);
    expect(model.exportGroups[0].metricSummaryColumns.map(column => column.key)).toEqual(model.metricColumns.map(column => column.key));
    expect(model.exportGroups[0].metricSummaryRows[0]).toMatchObject({
      id: 'row-1',
      label: 'Espresso',
      metricValues: expect.objectContaining({ tax_GST_TEST: 2.1, tax_PST_TEST: 4.9, tax_HST_ONLY: null, returns: 2 }),
    });
    expect(model.exportGroups[0].periodTableRows[0].periodValues).toEqual({
      'period-1': 10,
      'period-2': 12,
      'period-3': 14,
      'period-4': 16,
    });
    expect(model.exportGroups[1].periodTableRows[0].periodValues).toEqual({
      'period-5': 18,
    });

    const totalsRow = model.footerRows.find(row => row.key === 'totals');
    const gstFooterRow = model.footerRows.find(row => row.key === 'tax-tax_GST_TEST');
    const hstFooterRow = model.footerRows.find(row => row.key === 'tax-tax_HST_ONLY');

    expect(totalsRow?.periodValues['period-1']).toBe(100);
    expect(totalsRow?.periodValues['period-4']).toBe(130);
    expect(totalsRow?.periodValues['period-5']).toBe(140);
    expect(gstFooterRow?.periodValues['period-1']).toBe(3);
    expect(gstFooterRow?.periodValues['period-5']).toBe(4.2);
    expect(hstFooterRow?.periodValues['period-1']).toBeNull();
    expect(hstFooterRow?.periodValues['period-5']).toBe(1.5);
    expect(model.exportGroups[0].periodFooterRows.find(row => row.key === 'totals')?.periodValues).toEqual({
      'period-1': 100,
      'period-2': 110,
      'period-3': 120,
      'period-4': 130,
    });
  });

  it('respects selected-measure visibility rules for metrics and footer rows', () => {
    const taxModel = buildSalesReportViewModel({
      report: sampleReport,
      labelColumnTitle: 'Product',
      selectedMeasure: 'TAX',
      selectedMeasureLabel: 'Tax',
    });
    const saleCountModel = buildSalesReportViewModel({
      report: sampleReport,
      labelColumnTitle: 'Product',
      selectedMeasure: 'SALE_COUNT',
      selectedMeasureLabel: 'Sale Count',
    });

    expect(taxModel.metricColumns.map(column => column.key)).not.toContain('tax');
    expect(taxModel.metricColumns.map(column => column.key)).toEqual(
      expect.arrayContaining(['revenue', 'tax_GST_TEST', 'tax_PST_TEST', 'tax_HST_ONLY'])
    );
    expect(taxModel.footerRows.map(row => row.key)).toEqual(expect.arrayContaining(['tax-tax_GST_TEST', 'tax-tax_PST_TEST', 'tax-tax_HST_ONLY']));
    expect(saleCountModel.footerRows.map(row => row.key)).not.toContain('selected-measure');
  });
});
