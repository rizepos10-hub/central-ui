import {
  analyticsReportPrintStyles,
  buildInventoryWorkbook,
  buildCashierByTerminalWorkbook,
  buildOptimizedProductSalesWorkbook,
  buildSalesActivitySummaryWorkbook,
  createReportFileName,
  downloadElementAsPdf,
  fetchAllPaginatedRows,
  fetchAllStoreCreditRows,
} from './report-export-utils';

const mockHtml2PdfSave = jest.fn().mockResolvedValue(undefined);
const mockHtml2PdfFrom = jest.fn();
const mockHtml2PdfSet = jest.fn();
const mockHtml2PdfInstance = {
  set: mockHtml2PdfSet,
  from: mockHtml2PdfFrom,
  save: mockHtml2PdfSave,
};
const mockHtml2PdfFactory = jest.fn(() => mockHtml2PdfInstance);

jest.mock('html2pdf.js', () => ({
  __esModule: true,
  default: mockHtml2PdfFactory,
}));

describe('report export utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHtml2PdfSet.mockReturnValue(mockHtml2PdfInstance);
    mockHtml2PdfFrom.mockReturnValue(mockHtml2PdfInstance);
  });

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
    expect(fetchPage).toHaveBeenNthCalledWith(1, {
      fromDate: null,
      toDate: null,
      onAccountEnabled: null,
      accountNumber: null,
      page: 0,
      size: 2,
    });
    expect(fetchPage).toHaveBeenNthCalledWith(2, {
      fromDate: null,
      toDate: null,
      onAccountEnabled: null,
      accountNumber: null,
      page: 1,
      size: 2,
    });
    expect(rows).toHaveLength(3);
  });

  it('fetchAllStoreCreditRows stops when the backend repeats the same full page', async () => {
    const repeatedPage = [
      { customerId: '1', customerName: 'A', creditLimit: 10, balance: 5 },
      { customerId: '2', customerName: 'B', creditLimit: 20, balance: 10 },
    ];
    const fetchPage = jest.fn().mockResolvedValue(repeatedPage);

    const rows = await fetchAllStoreCreditRows(fetchPage, { size: 2 });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, {
      fromDate: null,
      toDate: null,
      onAccountEnabled: null,
      accountNumber: null,
      page: 0,
      size: 2,
    });
    expect(fetchPage).toHaveBeenNthCalledWith(2, {
      fromDate: null,
      toDate: null,
      onAccountEnabled: null,
      accountNumber: null,
      page: 1,
      size: 2,
    });
    expect(rows).toEqual(repeatedPage);
  });

  it('fetchAllPaginatedRows stops when total count keeps growing but unique rows stop progressing', async () => {
    const repeatedPage = [
      { id: '1', name: 'Burger' },
      { id: '2', name: 'Pizza' },
    ];
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce({ rows: repeatedPage, totalCount: 10 })
      .mockResolvedValueOnce({ rows: repeatedPage, totalCount: 10 })
      .mockResolvedValueOnce({ rows: repeatedPage, totalCount: 10 });

    const rows = await fetchAllPaginatedRows(fetchPage, {
      size: 2,
      getRowSignature: row => row.id,
    });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(rows).toEqual(repeatedPage);
  });

  it('createReportFileName slugifies report details', () => {
    expect(createReportFileName('Customer Balance Report', ['Main Branch', '2026/03/26'])).toBe(
      'customer-balance-report-main-branch-2026-03-26'
    );
  });

  it('analyticsReportPrintStyles includes export-safe page-break and no-hyphen rules', () => {
    const styles = analyticsReportPrintStyles('portrait');

    expect(styles).toContain('.report-section-card');
    expect(styles).toContain('.report-export-header');
    expect(styles).toContain('.report-numeric-cell');
    expect(styles).toContain('overflow-wrap: break-word');
    expect(styles).toContain('hyphens: none');
    expect(styles).toContain('page-break-inside: avoid');
  });

  it('downloadElementAsPdf injects export-safe styles, applies export width, and narrows pagebreak avoidance', async () => {
    const element = document.createElement('div');
    element.className = 'report-export-root';
    document.body.appendChild(element);

    await downloadElementAsPdf(element, { fileName: 'sales-summary-report', orientation: 'portrait' });

    expect(mockHtml2PdfFactory).toHaveBeenCalledTimes(1);
    expect(mockHtml2PdfSet).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'sales-summary-report.pdf',
        pagebreak: expect.objectContaining({
          mode: ['css', 'legacy'],
          avoid: expect.arrayContaining(['tr', 'thead', '.report-section-header', '.report-export-header']),
        }),
      })
    );
    const setOptions = mockHtml2PdfSet.mock.calls[0][0];
    expect(setOptions.pagebreak.avoid).not.toContain('td');
    expect(setOptions.pagebreak.avoid).not.toContain('table');
    expect(setOptions.pagebreak.avoid).not.toContain('.report-section-card');
    expect(mockHtml2PdfFrom).toHaveBeenCalledWith(element);
    expect(mockHtml2PdfSave).toHaveBeenCalledTimes(1);
    expect(element.style.width).toBe('');
    expect(element.style.maxWidth).toBe('');
    expect(element.style.minWidth).toBe('');
    expect(element.querySelector('[data-report-export-pdf-style="true"]')).toBeNull();
  });

  it('downloadElementAsPdf uses the landscape export width by default', async () => {
    const element = document.createElement('div');
    element.className = 'report-export-root';
    document.body.appendChild(element);

    mockHtml2PdfSet.mockImplementation((options: Record<string, unknown>) => {
      expect(element.style.width).toBe('1040px');
      expect(options.jsPDF).toEqual(expect.objectContaining({ orientation: 'landscape' }));
      return mockHtml2PdfInstance;
    });

    await downloadElementAsPdf(element, { fileName: 'sales-report', orientation: 'landscape' });

    expect(element.style.width).toBe('');
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

  it('buildInventoryWorkbook uses the flattened inventory export rows', () => {
    const workbook = buildInventoryWorkbook(
      [
        {
          itemName: 'Burger',
          variantName: 'Regular',
          price: '10',
          locationName: 'Main',
          locationType: 'STORE',
          quantity: '3',
          unitCost: '4',
        },
      ],
      { title: 'Inventory Report' }
    );

    expect(workbook.sheets[0].name).toBe('Inventory Report');
    expect(workbook.sheets[0].rows).toEqual(
      expect.arrayContaining([
        ['Item', 'Variant', 'Price', 'Location', 'Location Type', 'Quantity', 'Unit Cost'],
        ['Burger', 'Regular', '10', 'Main', 'STORE', '3', '4'],
      ])
    );
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
