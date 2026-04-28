import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { fetchCommissionFeesReport } from 'app/modules/analytics/api';
import CommissionFeesReport from './commission-fees-report';

const mockDispatch = jest.fn();
const mockState = {
  branch: {
    entities: [
      {
        id: 'branch-1',
        name: 'Main Branch',
        timezone: 'UTC',
      },
    ],
  },
  businessDetail: {
    entities: [
      {
        id: 'business_1010',
        businessName: 'Maza Foods',
        logo: { url: 'https://example.com/logo.png' },
      },
    ],
    loading: false,
  },
  businessTimeZone: {
    timeZone: 'UTC',
  },
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('app/modules/analytics/api', () => ({
  fetchCommissionFeesReport: jest.fn(),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/shared/util/timezone-utils', () => ({
  formatDateForDisplay: jest.fn(value => value),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children }) => <div>{children}</div>,
  PopoverTrigger: ({ children }) => <div>{children}</div>,
  PopoverContent: ({ children }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/calendar', () => ({
  Calendar: ({ onSelect }) => (
    <button
      type="button"
      data-testid="mock-date-range"
      onClick={() =>
        onSelect({
          from: new Date('2026-01-01T00:00:00.000Z'),
          to: new Date('2026-04-01T00:00:00.000Z'),
        })
      }
    >
      Pick mocked date range
    </button>
  ),
}));

jest.mock('@/components/ui/select', () => {
  const SelectContext = React.createContext({ onValueChange: (_value: string) => undefined });

  return {
    Select: ({ children, onValueChange }) => (
      <SelectContext.Provider value={{ onValueChange }}>{children}</SelectContext.Provider>
    ),
    SelectTrigger: ({ children, className }) => <div className={className}>{children}</div>,
    SelectValue: ({ placeholder }) => <span>{placeholder}</span>,
    SelectContent: ({ children }) => <div>{children}</div>,
    SelectItem: ({ children, value, className }) => {
      const context = React.useContext(SelectContext);
      return (
        <button type="button" className={className} onClick={() => context.onValueChange(value)}>
          {children}
        </button>
      );
    },
  };
});

const mockedFetchCommissionFeesReport = fetchCommissionFeesReport as jest.MockedFunction<typeof fetchCommissionFeesReport>;

describe('CommissionFeesReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const applyRequiredFilters = () => {
    fireEvent.click(screen.getByTestId('mock-date-range'));
    fireEvent.click(screen.getByText('Main Branch'));
  };

  it('requires date range and branch before enabling the report action', async () => {
    render(<CommissionFeesReport />);

    expect(screen.getByRole('button', { name: 'Get Report' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-excel').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-pdf').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-print').hasAttribute('disabled')).toBe(true);

    applyRequiredFilters();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Get Report' }).hasAttribute('disabled')).toBe(false);
    });
  });

  it('submits the required filters and renders the returned summary metrics', async () => {
    mockedFetchCommissionFeesReport.mockResolvedValueOnce({
      ordersCount: 41,
      subtotalSum: 701925.74,
      commissionRate: 2.5,
      commissionAmount: 17548.14,
    });

    render(<CommissionFeesReport />);

    applyRequiredFilters();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Get Report' }));
    });

    await waitFor(() => {
      expect(mockedFetchCommissionFeesReport).toHaveBeenCalledWith({
        fromDate: '2026-01-01T00:00:00.000Z',
        toDate: '2026-04-01T23:59:59.000Z',
        branch: 'branch-1',
      });
    });

    expect(await screen.findByText('41')).not.toBeNull();
    expect(screen.getByText('701925.74')).not.toBeNull();
    expect(screen.getByText('2.50%')).not.toBeNull();
    expect(screen.getByText('17548.14')).not.toBeNull();
    expect(screen.getByTestId('report-action-excel').hasAttribute('disabled')).toBe(false);
  });

  it('refreshes using the last applied filters', async () => {
    mockedFetchCommissionFeesReport
      .mockResolvedValueOnce({
        ordersCount: 41,
        subtotalSum: 701925.74,
        commissionRate: 2.5,
        commissionAmount: 17548.14,
      })
      .mockResolvedValueOnce({
        ordersCount: 41,
        subtotalSum: 701925.74,
        commissionRate: 2.5,
        commissionAmount: 17548.14,
      });

    render(<CommissionFeesReport />);

    applyRequiredFilters();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Get Report' }));
    });

    await waitFor(() => {
      expect(mockedFetchCommissionFeesReport).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    });

    await waitFor(() => {
      expect(mockedFetchCommissionFeesReport).toHaveBeenCalledTimes(2);
    });

    expect(mockedFetchCommissionFeesReport).toHaveBeenNthCalledWith(2, {
      fromDate: '2026-01-01T00:00:00.000Z',
      toDate: '2026-04-01T23:59:59.000Z',
      branch: 'branch-1',
    });
  });

  it('shows an error state and keeps export actions disabled when the api call fails', async () => {
    mockedFetchCommissionFeesReport.mockRejectedValueOnce(new Error('Network Error'));

    render(<CommissionFeesReport />);

    applyRequiredFilters();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Get Report' }));
    });

    await waitFor(() => {
      expect(screen.getByTestId('commission-fees-report-error')).not.toBeNull();
    });

    expect(screen.getByText('Unable to load commission fees report.')).not.toBeNull();
    expect(screen.getByTestId('report-action-excel').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-pdf').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-print').hasAttribute('disabled')).toBe(true);
  });
});
