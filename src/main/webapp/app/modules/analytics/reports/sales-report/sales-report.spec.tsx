import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { downloadElementAsPdf } from 'app/shared/util/report-export-utils';
import { SalesReport } from './sales-report';

const mockDispatch = jest.fn();
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
          taxes: 'VAT',
          returns: 2,
        },
      ],
      totalByDateRange: {
        year1: { value: 100, revenue: 100, costOfGoods: 40, grossProfit: 60, margin: 60, tax: 10, taxes: 'VAT', returns: 1 },
        year2: { value: 110, revenue: 110, costOfGoods: 44, grossProfit: 66, margin: 66, tax: 11, taxes: 'VAT', returns: 2 },
        year3: { value: 120, revenue: 120, costOfGoods: 48, grossProfit: 72, margin: 72, tax: 12, taxes: 'VAT', returns: 3 },
        year4: { value: 130, revenue: 130, costOfGoods: 52, grossProfit: 78, margin: 78, tax: 13, taxes: 'VAT', returns: 4 },
        year5: { value: 140, revenue: 140, costOfGoods: 56, grossProfit: 84, margin: 84, tax: 14, taxes: 'VAT', returns: 5 },
      },
    },
    loading: false,
    error: null,
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
  useParams: () => ({ reportType: mockReportType }),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/modules/analytics/reports/sales-report/custom-date-range', () => () => (
  <div data-testid="sales-report-date-range">date-range</div>
));

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;

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
    expect(exportElement.querySelectorAll('[data-testid="sales-report-export-metric-table"]')).toHaveLength(4);
    expect(mockedDownloadElementAsPdf).toHaveBeenCalledWith(
      exportElement,
      expect.objectContaining({ orientation: 'landscape' })
    );
    expect(exportElement.textContent).toContain('US Dollar');
    expect(exportElement.textContent).toContain('Summary Metrics');
  });
});
