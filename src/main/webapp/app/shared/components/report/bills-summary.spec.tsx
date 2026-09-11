import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { fetchRecentByDate } from 'app/modules/analytics/api';
import BillsSummary from './bills-summary';

jest.mock('app/modules/analytics/api', () => ({
  fetchRecentByDate: jest.fn(),
  fetchRecentBills: jest.fn(),
}));

jest.mock('../pagination/pagination-filter-state-vals', () => () => <div>pagination</div>);

describe('BillsSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests the list with every sales summary filter', async () => {
    (fetchRecentByDate as jest.MockedFunction<typeof fetchRecentByDate>).mockResolvedValueOnce({
      data: [{ sequenceNumber: '1001', dateTime: '2026-03-02T10:00:00.000Z', total: 12 }],
      headers: { 'x-total-count': '1' },
    } as any);

    render(
      <BillsSummary
        eodId={null}
        fromDate="2026-03-01T00:00:00.000Z"
        toDate="2026-03-31T23:59:59.000Z"
        branchId="branch-1"
        source="POS"
        dayOfWeek="MONDAY"
      />
    );

    await waitFor(() => {
      expect(fetchRecentByDate).toHaveBeenCalledWith(
        0,
        10,
        '2026-03-01T00:00:00.000Z',
        '2026-03-31T23:59:59.000Z',
        'branch-1',
        'POS',
        'MONDAY'
      );
    });
  });

  it('reloads the list when the selected branch changes', async () => {
    (fetchRecentByDate as jest.MockedFunction<typeof fetchRecentByDate>).mockResolvedValue({
      data: [{ sequenceNumber: '1001', dateTime: '2026-03-02T10:00:00.000Z', total: 12 }],
      headers: { 'x-total-count': '1' },
    } as any);

    const { rerender } = render(
      <BillsSummary
        eodId={null}
        fromDate="2026-03-01T00:00:00.000Z"
        toDate="2026-03-31T23:59:59.000Z"
        branchId="branch-1"
        source="POS"
      />
    );

    await waitFor(() => expect(fetchRecentByDate).toHaveBeenCalledWith(
      0,
      10,
      '2026-03-01T00:00:00.000Z',
      '2026-03-31T23:59:59.000Z',
      'branch-1',
      'POS',
      undefined
    ));

    rerender(
      <BillsSummary
        eodId={null}
        fromDate="2026-03-01T00:00:00.000Z"
        toDate="2026-03-31T23:59:59.000Z"
        branchId="branch-2"
        source="POS"
      />
    );

    await waitFor(() => expect(fetchRecentByDate).toHaveBeenLastCalledWith(
      0,
      10,
      '2026-03-01T00:00:00.000Z',
      '2026-03-31T23:59:59.000Z',
      'branch-2',
      'POS',
      undefined
    ));
  });

  it('shows a section-level api error when the bills summary request fails', async () => {
    (fetchRecentByDate as jest.MockedFunction<typeof fetchRecentByDate>).mockRejectedValueOnce(new Error('Network Error'));

    render(
      <BillsSummary
        eodId={null}
        fromDate="2026-03-01T00:00:00.000Z"
        toDate="2026-03-31T23:59:59.000Z"
        branchId="branch-1"
        source="POS"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('bills-summary-error')).not.toBeNull();
    });
  });
});
