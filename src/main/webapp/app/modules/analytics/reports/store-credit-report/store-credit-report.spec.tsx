import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { fetchStoreCreditReport } from 'app/modules/analytics/api';
import { downloadElementAsPdf } from 'app/shared/util/report-export-utils';
import StoreCreditReport from './store-credit-report';

const mockDispatch = jest.fn();
const mockState = {
  businessDetail: {
    entities: [
      {
        businessName: 'Maza Foods',
        logo: { url: 'https://example.com/logo.png' },
      },
    ],
    loading: false,
  },
};

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('app/modules/analytics/api', () => ({
  fetchStoreCreditReport: jest.fn(),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedFetchStoreCreditReport = fetchStoreCreditReport as jest.MockedFunction<typeof fetchStoreCreditReport>;
const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
};

describe('StoreCreditReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps export actions disabled until the initial report loads', async () => {
    const deferred = createDeferred<any>();
    mockedFetchStoreCreditReport.mockReturnValueOnce(deferred.promise);

    render(<StoreCreditReport />);

    expect(screen.getByTestId('report-action-excel').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-pdf').hasAttribute('disabled')).toBe(true);
    expect(screen.getByTestId('report-action-print').hasAttribute('disabled')).toBe(true);

    deferred.resolve([{ customerId: '1', customerName: 'Alice', creditLimit: 10, balance: 3 }]);

    await waitFor(() => {
      expect(screen.getByText('Alice')).not.toBeNull();
    });

    expect(screen.getByTestId('report-action-excel').hasAttribute('disabled')).toBe(false);
    expect(screen.getByTestId('report-action-pdf').hasAttribute('disabled')).toBe(false);
    expect(screen.getByTestId('report-action-print').hasAttribute('disabled')).toBe(false);
  });

  it('exports the full dataset to pdf using the shared pdf helper', async () => {
    mockedFetchStoreCreditReport
      .mockResolvedValueOnce([{ customerId: '1', customerName: 'Alice', creditLimit: 10, balance: 3 }])
      .mockResolvedValueOnce([{ customerId: '1', customerName: 'Alice', creditLimit: 10, balance: 3 }]);

    render(<StoreCreditReport />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).not.toBeNull();
    });

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('report-export-header')).not.toBeNull();
    expect(screen.getByText('Maza Foods')).not.toBeNull();
    expect(mockedDownloadElementAsPdf.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    expect((mockedDownloadElementAsPdf.mock.calls[0][0] as HTMLElement).className).toContain('report-export-root');
    expect((mockedDownloadElementAsPdf.mock.calls[0][0] as HTMLElement).parentElement?.className).not.toContain('w-[1000px]');
    expect(mockedDownloadElementAsPdf.mock.calls[0][1]).toMatchObject({
      fileName: 'customer-balance-report',
      orientation: 'portrait',
    });
    expect(mockedFetchStoreCreditReport).toHaveBeenLastCalledWith({
      fromDate: null,
      toDate: null,
      onAccountEnabled: null,
      accountNumber: null,
      page: 0,
      size: 250,
    });
  });

  it('stops requesting export pages when the backend repeats the same full page', async () => {
    const repeatedPage = [
      { customerId: '1', customerName: 'Alice', creditLimit: 10, balance: 3 },
      { customerId: '2', customerName: 'Bob', creditLimit: 20, balance: 5 },
    ];

    mockedFetchStoreCreditReport
      .mockResolvedValueOnce([{ customerId: '1', customerName: 'Alice', creditLimit: 10, balance: 3 }])
      .mockResolvedValueOnce(repeatedPage)
      .mockResolvedValueOnce(repeatedPage);

    render(<StoreCreditReport />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).not.toBeNull();
    });

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(mockedFetchStoreCreditReport).toHaveBeenCalledTimes(3);
    expect(mockedFetchStoreCreditReport).toHaveBeenNthCalledWith(2, {
      fromDate: null,
      toDate: null,
      onAccountEnabled: null,
      accountNumber: null,
      page: 0,
      size: 250,
    });
    expect(mockedFetchStoreCreditReport).toHaveBeenNthCalledWith(3, {
      fromDate: null,
      toDate: null,
      onAccountEnabled: null,
      accountNumber: null,
      page: 1,
      size: 250,
    });
  });
});
