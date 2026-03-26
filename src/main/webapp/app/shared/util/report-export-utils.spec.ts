import {
  buildCashierByTerminalWorkbook,
  buildOptimizedProductSalesWorkbook,
  buildSalesActivitySummaryWorkbook,
  createReportFileName,
  fetchAllStoreCreditRows,
} from './report-export-utils';

describe('report export utils', () => {
  it('fetchAllStoreCreditRows concatenates pages until a short page is returned', async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce([
        { customerId: '1', customerName: 'A', creditLimit: 10, balance: 5 },
        { customerId: '2', customerName: 'B', creditLimit: 20, balance: 10 },
      ])
      .mockResolvedValueOnce([{ customerId: '3', customerName: 'C', creditLimit: 30, balance: 15 }]);

    const rows = await fetchAllStoreCreditRows(fetchPage, { size: 2 });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, { fromDate: null, toDate: null, page: 0, size: 2 });
    expect(fetchPage).toHaveBeenNthCalledWith(2, { fromDate: null, toDate: null, page: 1, size: 2 });
    expect(rows).toHaveLength(3);
  });

  it('createReportFileName slugifies report details', () => {
    expect(createReportFileName('Customer Balance Report', ['Main Branch', '2026/03/26'])).toBe(
      'customer-balance-report-main-branch-2026-03-26'
    );
  });

  it('buildOptimizedProductSalesWorkbook appends the totals row', () => {
    const workbook = buildOptimizedProductSalesWorkbook(
      {
        items: [
          {
            itemId: '1',
            receiptAlias: 'Burger',
            quantity: 2,
            quantityPercent: 10,
            extCost: 5,
            sales: 12,
            margin: 7,
            marginPercent: 58.33,
          },
        ],
        totalQuantity: 2,
        totalExtCost: 5,
        totalSales: 12,
        totalMargin: 7,
      },
      { title: 'Optimized Product Sales Report' }
    );

    const sheet = workbook.sheets[0];
    expect(sheet.name).toBe('Optimized Product Sales');
    expect(sheet.rows[sheet.rows.length - 1]).toEqual(['Totals', '2', '-', '5.00', '12.00', '7.00', '-']);
  });

  it('buildSalesActivitySummaryWorkbook creates summary and section sheets', () => {
    const workbook = buildSalesActivitySummaryWorkbook(
      {
        totalSalesSection: {
          grossSalesWithTax: 100,
          averageSale: 25,
        },
        cashierNegative: {
          rows: [{ field: 'Negative', amount: 4, quantity: 1 }],
          totalAmount: 4,
          totalQuantity: 1,
        },
        collectedSalesTax: {
          rows: [{ taxCode: 'VAT', amount: 6, taxableSales: 60 }],
          totalAmount: 6,
        },
      },
      { title: 'Sales Activity Summary Report' }
    );

    expect(workbook.sheets.map(sheet => sheet.name)).toEqual(
      expect.arrayContaining(['Summary', 'Cashier Negative', 'Collected Sales Tax'])
    );
    expect(workbook.sheets[0].rows[0][0]).toBe('Sales Activity Summary Report');
    expect(workbook.sheets[0].rows).toEqual(expect.arrayContaining([['Average Sale', 25]]));
  });

  it('buildCashierByTerminalWorkbook sanitizes duplicate sheet names and keeps totals rows', () => {
    const workbook = buildCashierByTerminalWorkbook(
      {
        terminals: [
          {
            registryId: '1',
            registryName: 'Terminal / West [01] * Very Long Name',
            houseCharge: {
              rows: [{ type: 'House', amount: 11, quantity: 2 }],
              totalAmount: 11,
              totalQuantity: 2,
            },
          },
          {
            registryId: '2',
            registryName: 'Terminal / West [01] * Very Long Name',
            houseCharge: {
              rows: [{ type: 'House', amount: 8, quantity: 1 }],
              totalAmount: 8,
              totalQuantity: 1,
            },
          },
        ],
      },
      { title: 'Cashier By Terminal Report' }
    );

    expect(workbook.sheets).toHaveLength(2);
    expect(workbook.sheets[0].name).not.toBe(workbook.sheets[1].name);
    expect(workbook.sheets[0].name.length).toBeLessThanOrEqual(31);
    expect(workbook.sheets[0].rows).toEqual(expect.arrayContaining([['Totals', '11.00', '2']]));
  });
});
