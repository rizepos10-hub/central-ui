import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';

import SalesSummaryReport from './summary-report';

const mockDispatch = jest.fn();
const mockState = {
  branch: {
    entities: [],
  },
  businessTimeZone: {
    timeZone: 'UTC',
  },
};

jest.mock('axios');

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('./end-of-day/dynamic-end-of-day-report', () => () => <div>dynamic-eod-report</div>);

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SalesSummaryReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a visible api error when the sales summary request fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<SalesSummaryReport />);

    fireEvent.click(screen.getByText('Last Week'));
    fireEvent.click(screen.getByText('Get Report'));

    await waitFor(() => {
      expect(screen.getByTestId('sales-summary-report-error')).not.toBeNull();
    });

    expect(screen.queryByText('dynamic-eod-report')).toBeNull();
  });
});
