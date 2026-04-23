import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { fetchFirstLastBillsSummary } from '../../api';
import { downloadElementAsPdf } from 'app/shared/util/report-export-utils';
import DynamicEndOfDayReportUI from './dynamic-end-of-day-report';

const mockDispatch = jest.fn(() => Promise.resolve({ payload: { data: [{ branchDetails: [] }] } }));
const mockState = {
  branch: {
    entities: [{ id: 'branch-1', name: 'Main Branch' }],
  },
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

jest.mock('../../api', () => ({
  fetchFirstLastBills: jest.fn().mockResolvedValue({ data: { firstBill: null, lastBill: null } }),
  fetchFirstLastBillsSummary: jest.fn().mockResolvedValue({
    data: {
      firstBill: { createdDate: '2026-03-01T10:00:00.000Z' },
      lastBill: { createdDate: '2026-03-31T18:00:00.000Z' },
    },
  }),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/shared/components/report/generic-sales-report', () => () => <div>generic-sales-report</div>);
jest.mock('app/shared/components/report/summary-report-total-received', () => () => <div>summary-report-total-received</div>);
jest.mock('app/shared/components/report/tip-summary', () => () => <div>tip-summary</div>);
jest.mock('app/modules/analytics/reports/end-of-day/related-tills', () => () => <div>related-tills</div>);
jest.mock('app/shared/components/report/bills-summary', () => () => <div>bills-summary</div>);
jest.mock('app/shared/components/report/order-charge-summary', () => () => <div>order-charge-summary</div>);
jest.mock('./category-report', () => () => <div>category-report</div>);

jest.mock('app/shared/util/report-export-utils', () => {
  const actual = jest.requireActual('app/shared/util/report-export-utils');
  return {
    ...actual,
    downloadElementAsPdf: jest.fn().mockResolvedValue(undefined),
  };
});

const mockedDownloadElementAsPdf = downloadElementAsPdf as jest.MockedFunction<typeof downloadElementAsPdf>;
const mockedFetchFirstLastBillsSummary = fetchFirstLastBillsSummary as jest.MockedFunction<typeof fetchFirstLastBillsSummary>;

describe('DynamicEndOfDayReportUI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the shared export header and keeps summary excel export working', async () => {
    const handleExcelExport = jest.fn();
    const printWrapperRef = { current: null as HTMLDivElement | null };

    render(
      <DynamicEndOfDayReportUI
        reportData={{
          totalSales: {
            orders: 1,
            subTotal: 10,
            discount: 0,
            appliedCoupon: 0,
            deliveryCharge: 0,
            deliveryTAX: 0,
            refunds: 0,
            netSales: 10,
            totalTAX: 0,
            grossSales: 10,
            walletCredits: 0,
            totalTip: 0,
            taxes: {},
          },
          totalSalesByOrderOption: {},
        }}
        endOfDay={null}
        printWrapperRef={printWrapperRef}
        loading={false}
        title="Sales Summary Report"
        branchId="branch-1"
        fromDate="2026-03-01T00:00:00.000Z"
        toDate="2026-03-31T23:59:59.000Z"
        source="POS"
        handleExcelExport={handleExcelExport}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('report-export-header')).not.toBeNull();
    });

    expect(screen.getByText('Maza Foods')).not.toBeNull();
    expect(screen.getByText('Sales Summary Report')).not.toBeNull();
    expect(screen.getByText('generic-sales-report')).not.toBeNull();
    expect(printWrapperRef.current?.className).toContain('report-export-root');

    fireEvent.click(screen.getByText('Export'));
    fireEvent.click(screen.getByText('Summary Report'));

    expect(handleExcelExport).toHaveBeenCalledTimes(1);
  });

  it('exports pdf through the shared helper', async () => {
    const printWrapperRef = { current: null as HTMLDivElement | null };

    render(
      <DynamicEndOfDayReportUI
        reportData={{
          totalSales: {
            orders: 1,
            subTotal: 10,
            discount: 0,
            appliedCoupon: 0,
            deliveryCharge: 0,
            deliveryTAX: 0,
            refunds: 0,
            netSales: 10,
            totalTAX: 0,
            grossSales: 10,
            walletCredits: 0,
            totalTip: 0,
            taxes: {},
          },
          totalSalesByOrderOption: {},
        }}
        endOfDay={null}
        printWrapperRef={printWrapperRef}
        loading={false}
        title="Sales Summary Report"
        branchId="branch-1"
        fromDate="2026-03-01T00:00:00.000Z"
        toDate="2026-03-31T23:59:59.000Z"
        source="POS"
        handleExcelExport={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('PDF'));

    await waitFor(() => {
      expect(mockedDownloadElementAsPdf).toHaveBeenCalledTimes(1);
    });

    expect(printWrapperRef.current?.className).toContain('report-export-root');
    expect(mockedDownloadElementAsPdf).toHaveBeenCalledWith(printWrapperRef.current, expect.objectContaining({ orientation: 'portrait' }));
  });

  it('shows a section-level api error when the first/last bills summary request fails', async () => {
    mockedFetchFirstLastBillsSummary.mockRejectedValueOnce(new Error('Network Error'));
    const printWrapperRef = { current: null as HTMLDivElement | null };

    render(
      <DynamicEndOfDayReportUI
        reportData={{
          totalSales: {
            orders: 1,
            subTotal: 10,
            discount: 0,
            appliedCoupon: 0,
            deliveryCharge: 0,
            deliveryTAX: 0,
            refunds: 0,
            netSales: 10,
            totalTAX: 0,
            grossSales: 10,
            walletCredits: 0,
            totalTip: 0,
            taxes: {},
          },
          totalSalesByOrderOption: {},
        }}
        endOfDay={null}
        printWrapperRef={printWrapperRef}
        loading={false}
        title="Sales Summary Report"
        branchId="branch-1"
        fromDate="2026-03-01T00:00:00.000Z"
        toDate="2026-03-31T23:59:59.000Z"
        source="POS"
        handleExcelExport={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('dynamic-eod-bills-summary-error')).not.toBeNull();
    });
  });
});
