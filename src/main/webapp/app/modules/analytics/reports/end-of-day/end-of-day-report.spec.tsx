import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';

import EndOfDayReportContainer from './end-of-day-report';

const mockDispatch = jest.fn();

jest.mock('axios');

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'eod-1' }),
}));

jest.mock('react-to-print', () => ({
  useReactToPrint: jest.fn(() => jest.fn()),
}));

jest.mock('app/entities/end-of-day/orders-tab', () => ({
  OrdersTab: () => <div>orders-tab</div>,
}));

jest.mock('app/shared/components/report/eod-report-layout', () => ({
  EodReportLayout: () => <div>eod-report-layout</div>,
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EndOfDayReportContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a visible api error when the end of day detail request fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<EndOfDayReportContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('end-of-day-report-error')).not.toBeNull();
    });

    expect(screen.queryByText('orders-tab')).toBeNull();
  });
});
