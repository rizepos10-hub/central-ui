import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import { downloadElementAsPdf, saveWorkbookAsExcel } from 'app/shared/util/report-export-utils';
import LoyaltyPointHistoryTable from './LoyaltyPointHistoryTable';

jest.mock('axios');

jest.mock('app/config/store', () => ({
  __esModule: true,
  default: () => ({
    getState: () => ({
      businessTimeZone: {
        timeZone: 'UTC',
      },
    }),
  }),
  useAppDispatch: () => jest.fn(),
  useAppSelector: (selector: any) =>
    selector({
      businessDetail: {
        entities: [
          {
            businessName: 'Maza Foods',
            logo: { url: 'https://example.com/logo.png' },
          },
        ],
        loading: false,
      },
    }),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
    saveWorkbookAsExcel: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;
const mockedSaveWorkbookAsExcel = saveWorkbookAsExcel as jest.MockedFunction<typeof saveWorkbookAsExcel>;

describe('LoyaltyPointHistoryTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders rounded loyalty values and a clickable order id', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          id: 'history-1',
          eventType: 'LOYALTY_REDEEMED',
          pointsDelta: -12.34799999999998,
          balanceAfter: 87.65200000000002,
          orderId: 'order-123',
          createdDate: '2026-06-29T10:00:00.000Z',
          createdBy: 'admin',
        },
      ],
      headers: {
        'x-total-count': '1',
      },
    } as any);

    render(
      <MemoryRouter>
        <LoyaltyPointHistoryTable customerId="customer-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('-12.35')).not.toBeNull();
    });

    expect(screen.getByText('87.65')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'order-123' }).getAttribute('href')).toBe('/order/order-123');
  });

  it('exports the full loyalty history dataset to excel', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 'history-1',
            eventType: 'LOYALTY_REDEEMED',
            pointsDelta: -12.35,
            balanceAfter: 87.65,
            orderId: 'order-123',
            createdDate: '2026-06-29T10:00:00.000Z',
            createdBy: 'admin',
            note: 'First page',
          },
        ],
        headers: { 'x-total-count': '2' },
      } as any)
      .mockResolvedValueOnce({
        data: [
          {
            id: 'history-1',
            eventType: 'LOYALTY_REDEEMED',
            pointsDelta: -12.35,
            balanceAfter: 87.65,
            orderId: 'order-123',
            createdDate: '2026-06-29T10:00:00.000Z',
            createdBy: 'admin',
            note: 'First page',
          },
          {
            id: 'history-2',
            eventType: 'ORDER_EARNED',
            pointsDelta: 5,
            balanceAfter: 92.65,
            orderId: 'order-456',
            createdDate: '2026-06-28T10:00:00.000Z',
            createdBy: 'cashier',
            note: 'Second row',
          },
        ],
        headers: { 'x-total-count': '2' },
      } as any);

    render(
      <MemoryRouter>
        <LoyaltyPointHistoryTable customerId="customer-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('-12.35')).not.toBeNull();
    });

    fireEvent.click(screen.getByTestId('report-action-excel'));

    await waitFor(() => {
      expect(mockedSaveWorkbookAsExcel).toHaveBeenCalledTimes(1);
    });

    expect(mockedAxios.get).toHaveBeenNthCalledWith(
      2,
      'api/customer-points/customer-1/history',
      expect.objectContaining({
        params: expect.objectContaining({
          page: 0,
          size: 250,
          sort: 'createdDate,desc',
        }),
      })
    );

    const workbook = mockedSaveWorkbookAsExcel.mock.calls[0][0];
    expect(workbook.sheets[0].rows).toEqual(
      expect.arrayContaining([
        ['Date', 'Action', 'Points Change', 'Balance After', 'Order', 'Created By', 'Note'],
        ['2026-06-29T10:00:00.000Z', 'LOYALTY_REDEEMED', -12.35, 87.65, 'order-123', 'admin', 'First page'],
        ['2026-06-28T10:00:00.000Z', 'ORDER_EARNED', 5, 92.65, 'order-456', 'cashier', 'Second row'],
      ])
    );
  });

  it('fetches the full loyalty history dataset before exporting pdf', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: [
          {
            id: 'history-1',
            eventType: 'LOYALTY_REDEEMED',
            pointsDelta: -12.35,
            balanceAfter: 87.65,
            orderId: 'order-123',
            createdDate: '2026-06-29T10:00:00.000Z',
          },
        ],
        headers: { 'x-total-count': '1' },
      } as any)
      .mockResolvedValueOnce({
        data: [
          {
            id: 'history-1',
            eventType: 'LOYALTY_REDEEMED',
            pointsDelta: -12.35,
            balanceAfter: 87.65,
            orderId: 'order-123',
            createdDate: '2026-06-29T10:00:00.000Z',
          },
        ],
        headers: { 'x-total-count': '1' },
      } as any);

    render(
      <MemoryRouter>
        <LoyaltyPointHistoryTable customerId="customer-1" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('-12.35')).not.toBeNull();
    });

    fireEvent.click(screen.getByTestId('report-action-pdf'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('report-export-header')).not.toBeNull();
  });
});
