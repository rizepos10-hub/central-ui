import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { saveAsExcelFile } from 'app/shared/util/excel-utils';
import { downloadElementAsPdf } from 'app/shared/util/report-export-utils';
import { SalesReport } from './sales-report';

const mockDispatch = jest.fn();
const mockAoaToSheet = jest.fn(() => ({}));
const mockEncodeCell = jest.fn(() => 'A1');
const mockWrite = jest.fn(() => new ArrayBuffer(8));
let mockReportType: string | undefined = 'product';

const mockState = {
  salesReportReducer: {
    data: {
      headerSlots: [
        { order: 1, label: '2022' },
        { order: 2, label: '2023' },
        { order: 3, label: '2024' },
        { order: 4, label: '2025' },
        { order: 5, label: '2026' },
      ],
      rows: [
        {
          rowRecord: { id: '1', name: 'Espresso' },
          slots: [
            { order: 1, value: 10 },
            { order: 2, value: 12 },
            { order: 3, value: 14 },
            { order: 4, value: 16 },
            { order: 5, value: 18 },
          ],
          value: 70,
          revenue: 70,
          costOfGoods: 25,
          grossProfit: 45,
          margin: 45,
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
          costOfGoods: 40,
          grossProfit: 60,
          margin: 60,
          tax: 10,
          taxes: { tax_GST_TEST: 3, tax_PST_TEST: 7 },
          returns: 1,
        },
        year2: {
          value: 110,
          revenue: 110,
          costOfGoods: 44,
          grossProfit: 66,
          margin: 66,
          tax: 11,
          taxes: { tax_GST_TEST: 3.3, tax_PST_TEST: 7.7 },
          returns: 2,
        },
        year3: {
          value: 120,
          revenue: 120,
          costOfGoods: 48,
          grossProfit: 72,
          margin: 72,
          tax: 12,
          taxes: { tax_GST_TEST: 3.6, tax_PST_TEST: 8.4 },
          returns: 3,
        },
        year4: {
          value: 130,
          revenue: 130,
          costOfGoods: 52,
          grossProfit: 78,
          margin: 78,
          tax: 13,
          taxes: { tax_GST_TEST: 3.9, tax_PST_TEST: 9.1 },
          returns: 4,
        },
        year5: {
          value: 140,
          revenue: 140,
          costOfGoods: 56,
          grossProfit: 84,
          margin: 84,
          tax: 14,
          taxes: { tax_GST_TEST: 4.2, tax_PST_TEST: 9.8, tax_HST_ONLY: 1.5 },
          returns: 5,
        },
      },
    },
    loading: false,
    error: null,
  },
  businessDetail: {
    entities: [],
    loading: false,
  },
  branch: {
    entities: [{ id: 'branch-1', name: 'Main Branch' }],
  },
  currencySettings: {
    entity: {
      defaultCurrency: { code: 'USD', rate: 1, currency: { code: 'USD' } },
      displayCurrency: { code: 'USD', name: 'US Dollar', rate: 1, currency: { code: 'USD' } },
      exchangeRates: [{ rate: 1, currency: { code: 'USD' } }],
    },
  },
  currencies: {
    entities: [{ code: 'USD', name: 'US Dollar' }],
  },
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  useParams: () => ({ reportType: mockReportType }),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/shared/util/date-utils', () => ({
  toLocalISOString: jest.fn((value: Date | string) => new Date(value).toISOString()),
}));

jest.mock('app/shared/util/timezone-utils', () => ({
  formatDateForDisplay: jest.fn((value: string) => value.slice(0, 10)),
}));

jest.mock('app/modules/analytics/reports/sales-report/custom-date-range', () => () => (
  <div data-testid="sales-report-date-range">date-range</div>
));

jest.mock('app/shared/util/excel-utils', () => ({
  saveAsExcelFile: jest.fn(),
}));

jest.mock('xlsx-js-style', () => ({
  __esModule: true,
  utils: {
    aoa_to_sheet: mockAoaToSheet,
    encode_cell: mockEncodeCell,
  },
  write: mockWrite,
}));

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;
const mockedSaveAsExcelFile = saveAsExcelFile as jest.MockedFunction<typeof saveAsExcelFile>;

describe('SalesReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReportType = 'product';
  });

  it('renders a single semantic screen table without the old fixed-height scroll layout', async () => {
    render(<SalesReport />);

    const table = await screen.findByTestId('sales-report-screen-table');
    const wrapper = screen.getByTestId('sales-report-screen-table-wrapper');

    expect(table.querySelector('thead')).not.toBeNull();
    expect(table.querySelector('tbody')).not.toBeNull();
    expect(table.querySelector('tfoot')).not.toBeNull();
    expect(wrapper.getAttribute('style')).toBeNull();
    expect(screen.getByTestId('sales-report-screen-shell').getAttribute('style')).toBeNull();
  });

  it('renders dynamic tax columns on screen and removes the old Taxes summary column', async () => {
    render(<SalesReport />);

    await screen.findByTestId('sales-report-screen-table');

    expect(screen.getAllByText('tax_GST_TEST').length).toBeGreaterThan(0);
    expect(screen.getAllByText('tax_PST_TEST').length).toBeGreaterThan(0);
    expect(screen.getAllByText('tax_HST_ONLY').length).toBeGreaterThan(0);
    expect(screen.queryByText('Taxes')).toBeNull();
  });

  it.each([
    ['product', 'Sales by Product'],
    ['category', 'Sales by Category'],
    ['branch', 'Sales by Branch'],
    ['user', 'Sales by User'],
    ['menu', 'Sales by Menu'],
    ['catalog', 'Sales by Catalog'],
  ])('supports the %s route variant in the shared layout', async (routeType, expectedLabel) => {
    mockReportType = routeType;

    render(<SalesReport />);

    await waitFor(() => {
      expect(screen.getAllByText(expectedLabel).length).toBeGreaterThan(0);
    });
  });

  it('keeps the general report route in the shared shell', async () => {
    mockReportType = undefined;

    render(<SalesReport />);

    await waitFor(() => {
      expect(screen.getAllByText('General Report').length).toBeGreaterThan(0);
    });
  });

  it('links product rows to the related product page and leaves branch rows as plain text', async () => {
    mockReportType = 'product';
    const { rerender } = render(<SalesReport />);

    const productLink = await screen.findByRole('link', { name: 'Espresso' });
    expect(productLink.getAttribute('href')).toBe('/product/1/edit');

    mockReportType = 'branch';
    rerender(<SalesReport />);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Espresso' })).toBeNull();
    });
  });

  it('renders grouped export sections and still exports pdf through the shared helper', async () => {
    mockReportType = 'product';

    render(<SalesReport />);

    expect(screen.queryByTestId('sales-report-export-root')).toBeNull();

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    const exportElement = mockedDownloadElementAsPdf.mock.calls[0][0] as HTMLElement;

    expect(exportElement.querySelectorAll('[data-testid="sales-report-export-group"]')).toHaveLength(2);
    expect(exportElement.querySelectorAll('[data-testid="sales-report-export-metric-table"]')).toHaveLength(6);
    expect(mockedDownloadElementAsPdf).toHaveBeenCalledWith(
      exportElement,
      expect.objectContaining({ orientation: 'landscape' })
    );
    expect(exportElement.textContent).toContain('US Dollar');
    expect(exportElement.textContent).toContain('Summary Metrics');
    expect(exportElement.textContent).toContain('tax_GST_TEST');
    expect(exportElement.textContent).toContain('tax_PST_TEST');
    expect(exportElement.textContent).toContain('tax_HST_ONLY');
    expect(exportElement.textContent).not.toContain('Taxes');
  });

  it('includes dynamic tax headers in the Excel export', async () => {
    render(<SalesReport />);

    fireEvent.click(screen.getByTestId('report-action-excel'));

    await waitFor(() => {
      expect(mockedSaveAsExcelFile).toHaveBeenCalledTimes(1);
    });

    const sheetRows = mockAoaToSheet.mock.calls[0][0] as Array<Array<string | number>>;
    const headerRow = sheetRows[0];

    expect(headerRow).toEqual(expect.arrayContaining(['tax_GST_TEST', 'tax_PST_TEST', 'tax_HST_ONLY']));
    expect(headerRow).not.toContain('Taxes');
  });
});
