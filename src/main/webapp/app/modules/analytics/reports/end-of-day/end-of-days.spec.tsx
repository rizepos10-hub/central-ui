import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { fetchEndOfDaysData } from 'app/modules/analytics/api';
import { EndOfDays } from './end-of-days';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockState = {
  branch: {
    entities: [],
  },
  businessTimeZone: {
    timeZone: 'UTC',
  },
};

jest.mock('app/modules/analytics/api', () => ({
  fetchEndOfDaysData: jest.fn(),
}));

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('EndOfDays', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a visible api error when the end of day list request fails', async () => {
    (fetchEndOfDaysData as jest.MockedFunction<typeof fetchEndOfDaysData>).mockRejectedValueOnce(new Error('timeout'));

    render(<EndOfDays />);

    await waitFor(() => {
      expect(screen.getByTestId('end-of-days-error')).not.toBeNull();
    });
  });
});

