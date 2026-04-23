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
