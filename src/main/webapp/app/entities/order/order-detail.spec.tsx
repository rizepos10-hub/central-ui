import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrderDetail from './order-detail';
import * as orderReducer from './order.reducer';
import * as deliveryReducer from './delivery.reducer';
import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';

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

jest.mock('app/shared/util/date-utils', () => ({
  toLocalISOString: jest.fn(value => (value instanceof Date ? value.toISOString() : value)),
}));

jest.mock('../bill/bill.reducer', () => ({
  changeEntityField: jest.fn(payload => ({ type: 'bill/changeEntityField', payload })),
}));

jest.mock('./ordered-items', () => () => null);

jest.mock('./order-payment-dialog', () => ({
  __esModule: true,
  default: ({ open, title, onSubmit }) =>
    open ? (
      <div data-testid="payment-dialog">
        <div>{title}</div>
        <button
          type="button"
          onClick={() =>
            onSubmit?.({
              amount: 20,
              tipAmount: 0,
              transactionMethod: 'cash',
            })
          }
        >
          Submit Payment
        </button>
      </div>
    ) : null,
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
        sourceApp: {
          type: 'CENTRAL_APP',
        },
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
      teams: [],
      agents: [],
    },
    branchRegistry: {
      entities: [],
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

    if (action?.type === 'order/change_processing_status') {
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
      expect(screen.getByTestId('payment-dialog').textContent).toContain('Add Payment to Bill AD-7');
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
      expect(screen.getByTestId('payment-dialog').textContent).toContain('Add Payment to Bill AD-3');
    });

    expect(orderReducer.createDraftBill).not.toHaveBeenCalled();
  });

  it('does not close non-wholesale draft orders after adding a payment', async () => {
    mockState.order.entity.processingStatus = OrderStatus.DRAFT;
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
      expect(screen.getByTestId('payment-dialog').textContent).toContain('Add Payment to Bill AD-3');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Payment' }));

    await waitFor(() => {
      expect(orderReducer.addPaymentToBill).toHaveBeenCalledWith({
        orderId: 'order-1',
        billId: 'bill-1',
        amount: 20,
        tipAmount: 0,
        transactionMethod: 'cash',
      });
    });

    expect(orderReducer.changeProcessingStatus).not.toHaveBeenCalled();
  });
});

describe('OrderDetail primary actions', () => {
  it('navigates to order edit when Edit Order is clicked', () => {
    renderOrderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Order' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/order/create',
      expect.objectContaining({
        state: expect.objectContaining({
          orderId: 'order-1',
        }),
      })
    );
  });

  it('marks draft orders as draft-edit when navigating to edit', () => {
    mockState.order.entity.processingStatus = 'DRAFT';

    renderOrderDetail();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Order' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/order/create',
      expect.objectContaining({
        state: expect.objectContaining({
          orderId: 'order-1',
          isDraftEdit: true,
        }),
      })
    );
  });

  it('opens the processing status confirmation dialog from the dropdown', async () => {
    mockState.order.entity.processingStatus = 'DRAFT';

    renderOrderDetail();

    fireEvent.change(screen.getByLabelText('Processing Status'), { target: { value: 'CONFIRMED' } });

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to change the status to CONFIRMED?')).toBeTruthy();
    });
  });
});

describe('OrderDetail delivery provider source', () => {
  it('uses deliveryProviderCode from totals for booked Tookan orders', async () => {
    mockState.order.entity.orderDeliveryDetails = {
      deliveryProviderCode: 'TOOKAN',
      date: '2026-03-30T09:00:00Z',
      integrationDetails: {
        teamId: '11',
        fleetId: '22',
      },
    };

    renderOrderDetail();

    await waitFor(() => {
      expect(deliveryReducer.getTookanTeams).toHaveBeenCalledWith();
    });

    expect(screen.getByText('Update')).toBeTruthy();
    expect(screen.getByText('Assign Driver')).toBeTruthy();
  });

  it('renders the actual provider tasks in route order regardless of API order', () => {
    mockState.order.entity.orderDeliveryDetails = {
      integrationDetails: {
        tasks: [
          {
            taskType: 'deliveredToCustomer',
            deliveryStatus: 'DELIVERED',
            jobDescription: "Delivered to customer's house",
          },
          {
            taskType: 'goingToRestaurant',
            deliveryStatus: 'ARRIVED',
            jobDescription: 'Driver reached the restaurant',
          },
          {
            taskType: 'pickedUpPackage',
            deliveryStatus: 'HANDED',
            jobDescription: 'Package picked up from the restaurant',
          },
        ],
      },
    };

    const { container } = renderOrderDetail();

    expect(screen.getByText('Tookan delivery')).toBeTruthy();
    expect(screen.getByText('Pickup stop 1')).toBeTruthy();
    expect(screen.getByText('Pickup stop 2')).toBeTruthy();
    expect(screen.getByText('Delivery')).toBeTruthy();
    expect(screen.getByText('ARRIVED')).toBeTruthy();
    expect(screen.getByText('HANDED')).toBeTruthy();
    expect(screen.getByText('DELIVERED')).toBeTruthy();

    const content = container.textContent || '';
    expect(content.indexOf('Pickup stop 1')).toBeLessThan(content.indexOf('Pickup stop 2'));
    expect(content.indexOf('Pickup stop 2')).toBeLessThan(content.indexOf('Delivery'));
  });

  it('shows pending for created tasks and hides delivery progress when there are no tasks', () => {
    const { rerender } = renderOrderDetail();

    expect(screen.queryByText('Tookan delivery')).toBeNull();

    mockState.order.entity.orderDeliveryDetails = {
      integrationDetails: {
        tasks: [
          {
            taskType: 'goingToRestaurant',
            deliveryStatus: 'CREATED',
            jobDescription: 'Waiting for dispatch',
          },
          {
            taskType: 'pickedUpPackage',
            deliveryStatus: 'CREATED',
            jobDescription: 'Waiting for pickup',
          },
          {
            taskType: 'deliveredToCustomer',
            deliveryStatus: 'CREATED',
            jobDescription: 'Waiting for delivery',
          },
        ],
      },
    };

    rerender(
      <MemoryRouter>
        <OrderDetail />
      </MemoryRouter>
    );

    expect(screen.getByText('Tookan delivery')).toBeTruthy();
    expect(screen.getAllByText('Pending')).toHaveLength(3);
  });

  it('keeps the page visible during silent polling refreshes after the initial load', () => {
    mockState.order.entity.orderDeliveryDetails = {
      integrationDetails: {
        tasks: [
          {
            taskType: 'goingToRestaurant',
            deliveryStatus: 'ARRIVED',
            jobDescription: 'Driver reached the restaurant',
          },
          {
            taskType: 'pickedUpPackage',
            deliveryStatus: 'HANDED',
            jobDescription: 'Package picked up from the restaurant',
          },
          {
            taskType: 'deliveredToCustomer',
            deliveryStatus: 'CREATED',
            jobDescription: 'Waiting for delivery',
          },
        ],
      },
    };

    const { rerender } = renderOrderDetail();

    expect(screen.getByText('Order Items')).toBeTruthy();

    mockState.order.loading = true;

    rerender(
      <MemoryRouter>
        <OrderDetail />
      </MemoryRouter>
    );

    expect(screen.getByText('Order Items')).toBeTruthy();
    expect(screen.queryByText('Tookan delivery')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('does not show provider selection for booked orders', () => {
    mockState.order.entity.orderDeliveryDetails = {
      deliveryProviderCode: 'ICABBI',
      date: '2026-03-30T09:00:00Z',
    };

    renderOrderDetail();

    expect(screen.getByText('Update')).toBeTruthy();
    expect(screen.queryByLabelText('Select provider')).toBeNull();
  });

  it('shows create-booking flow without provider selection for unbooked orders', () => {
    renderOrderDetail();

    expect(screen.getByRole('button', { name: 'Create Booking' })).toBeTruthy();
    expect(screen.queryByLabelText('Select provider')).toBeNull();
  });

  it('creates a booking without a provider for unbooked orders', async () => {
    const { container } = renderOrderDetail();
    const dateInput = container.querySelector<HTMLInputElement>('input[type="datetime-local"]');

    if (!dateInput) {
      throw new Error('Expected delivery datetime input to be rendered');
    }

    fireEvent.change(dateInput, { target: { value: '2026-04-13T10:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Booking' }));

    await waitFor(() => {
      expect(deliveryReducer.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
        })
      );
    });
  });
});
