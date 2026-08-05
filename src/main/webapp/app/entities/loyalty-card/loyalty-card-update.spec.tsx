import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';

import LoyaltyCardUpdate from './loyalty-card-update';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

const mockState = {
  loyaltycard: {
    entity: {
      id: 'card-1',
      wallet: null,
      cardHolderName: '',
      referenceNumber: 'REF-1',
      printed: false,
    },
    loading: false,
    updating: false,
  },
  branch: {
    entities: [],
  },
};

jest.mock('axios');

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: null }),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

jest.mock('./loyalty-card.reducer', () => ({
  changeEntityField: jest.fn(payload => ({ type: 'loyalty/changeEntityField', payload })),
  createEntity: jest.fn(payload => ({ type: 'loyalty/createEntity', payload })),
  getEntity: jest.fn(payload => ({ type: 'loyalty/getEntity', payload })),
  reset: jest.fn(() => ({ type: 'loyalty/reset' })),
  unassignCard: jest.fn(payload => ({ type: 'loyalty/unassignCard', payload })),
  updateEntity: jest.fn(payload => ({ type: 'loyalty/updateEntity', payload })),
}));

jest.mock('app/entities/branch/branch.reducer', () => ({
  getEntities: jest.fn(payload => ({ type: 'branch/getEntities', payload })),
}));

jest.mock('app/entities/loyalty/loyalty-records.reducer', () => ({
  getEntities: jest.fn(payload => ({ type: 'loyaltyRecords/getEntities', payload })),
}));

jest.mock('app/entities/customer/customer.reducer', () => ({
  assignCard: jest.fn(payload => ({ type: 'customer/assignCard', payload })),
}));

jest.mock('app/shared/components/select/async-select', () => ({
  __esModule: true,
  default: ({ loadOptions, placeholder }: any) => (
    <button
      type="button"
      onClick={() => loadOptions('acme')}
    >
      {placeholder}
    </button>
  ),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LoyaltyCardUpdate', () => {
  beforeAll(() => {
    (global as any).ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockReturnValue(Promise.resolve({ payload: { data: [] } }));
    mockedAxios.post.mockResolvedValue({
      data: [],
    } as any);
  });

  it('searches customers with one grouped request across name and business fields', async () => {
    render(<LoyaltyCardUpdate />);

    fireEvent.click(screen.getByRole('button', { name: 'Search customer' }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'api/_search/customers',
        expect.objectContaining({
          filters: {},
          groups: [
            {
              operator: 'OR',
              constraints: [
                { field: 'firstName', value: 'acme', matchMode: 'CONTAINS' },
                { field: 'lastName', value: 'acme', matchMode: 'CONTAINS' },
                { field: 'businessDetails.businessName', value: 'acme', matchMode: 'CONTAINS' },
              ],
            },
          ],
        })
      );
    });
  });
});
