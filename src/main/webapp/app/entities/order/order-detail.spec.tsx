import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrderDetail from './order-detail';
import * as orderReducer from './order.reducer';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();

let mockState;

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'order-1' }),
}));

jest.mock('./order.reducer', () => ({
  changeProcessingStatus: jest.fn(payload => ({ type: 'order/change_processing_status', payload })),
  createDraftBill: jest.fn(payload => ({ type: 'order/create_draft_bill', payload })),
  addPaymentToBill: jest.fn(payload => ({ type: 'order/add_payment_to_bill', payload })),
  getEntity: jest.fn(id => ({ type: 'order/get_entity', payload: id })),
  refundBill: jest.fn(payload => ({ type: 'order/refund_bill', payload })),
}));

jest.mock('./delivery.reducer', () => ({
  assignDriver: jest.fn(payload => ({ type: 'delivery/assign_driver', payload })),
  cancelBooking: jest.fn(payload => ({ type: 'delivery/cancel_booking', payload })),
  createBooking: jest.fn(payload => ({ type: 'delivery/create_booking', payload })),
  getActiveProviders: jest.fn(payload => ({ type: 'delivery/get_active_providers', payload })),
  getTookanAgents: jest.fn(payload => ({ type: 'delivery/get_tookan_agents', payload })),
  getTookanTeams: jest.fn(payload => ({ type: 'delivery/get_tookan_teams', payload })),
  syncBooking: jest.fn(payload => ({ type: 'delivery/sync_booking', payload })),
  updateBooking: jest.fn(payload => ({ type: 'delivery/update_booking', payload })),
}));

jest.mock('app/entities/online-ordering/settings/settings.reducer', () => ({
  getEntity: jest.fn(() => ({ type: 'uiSettings/get_entity' })),
}));

jest.mock('app/shared/util/timezone-utils', () => ({
  formatDateForDisplay: jest.fn(() => 'Mar 30, 2026'),
}));

jest.mock('../bill/bill.reducer', () => ({
  changeEntityField: jest.fn(payload => ({ type: 'bill/changeEntityField', payload })),
}));

jest.mock('./ordered-items', () => () => null);

jest.mock('./order-payment-dialog', () => ({
  __esModule: true,
  default: ({ open, title }) => (open ? <div data-testid="payment-dialog">{title}</div> : null),
}));

jest.mock('app/shared/components/select/select', () => ({
  __esModule: true,
  default: ({ options = [], value, onChange, placeholder, isDisabled }) => (
    <select
      aria-label={placeholder || 'select'}
      disabled={isDisabled}
      value={value?.value ?? ''}
      onChange={event => {
        const nextOption = options.find(option => String(option.value) === event.target.value) || null;
        onChange?.(nextOption);
      }}
    >
      <option value="">{placeholder || 'select'}</option>
      {options.map(option => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();

  mockState = {
    order: {
      entity: {
        id: 'order-1',
        sequenceNumber: 42,
        branchId: 'branch-1',
        customer: {
          id: 'customer-1',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        createdDate: '2026-03-30T09:00:00Z',
        items: [],
        bills: [],
      },
      loading: false,
    },
    bill: {
      entity: {
        items: [],
      },
    },
    uiSettings: {
      entity: {},
    },
    delivery: {
      activeProviders: [],
      teams: [],
      agents: [],
    },
  };

  mockDispatch.mockImplementation(action => {
    if (action?.type === 'order/create_draft_bill') {
      return {
        unwrap: () =>
          Promise.resolve({
            data: {
              id: 'draft-bill-id',
              sequenceNumber: 7,
              total: 20,
              paymentTransactions: [],
              status: 'DRAFT',
            },
          }),
      };
    }

    if (action?.type === 'order/add_payment_to_bill') {
      return {
        unwrap: () => Promise.resolve({ data: {} }),
      };
    }

    return action;
  });
});

const renderOrderDetail = () =>
  render(
    <MemoryRouter>
      <OrderDetail />
    </MemoryRouter>
  );

describe('OrderDetail payment integration', () => {
  it('does not auto-open payment flow on initial render', () => {
    renderOrderDetail();

    expect(orderReducer.createDraftBill).not.toHaveBeenCalled();
    expect(screen.queryByTestId('payment-dialog')).toBeNull();
  });

  it('creates a draft bill and opens the shared payment dialog when there are no bills', async () => {
    renderOrderDetail();

    fireEvent.click(screen.getByRole('button', { name: /add payment/i }));

    await waitFor(() => {
      expect(orderReducer.createDraftBill).toHaveBeenCalledWith({
        orderId: 'order-1',
        payee: null,
        createdBy: null,
        discount: null,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('payment-dialog').textContent).toContain('Add Payment to Bill #7');
    });
  });

  it('reuses an existing draft bill without creating a new one', async () => {
    mockState.order.entity.bills = [
      {
        id: 'bill-1',
        sequenceNumber: 3,
        total: 20,
        status: 'DRAFT',
        paymentTransactions: [],
        dateTime: '2026-03-30T09:00:00Z',
      },
    ];

    renderOrderDetail();

    fireEvent.click(screen.getAllByRole('button', { name: /add payment/i })[0]);

    await waitFor(() => {
      expect(screen.getByTestId('payment-dialog').textContent).toContain('Add Payment to Bill #3');
    });

    expect(orderReducer.createDraftBill).not.toHaveBeenCalled();
  });
});
