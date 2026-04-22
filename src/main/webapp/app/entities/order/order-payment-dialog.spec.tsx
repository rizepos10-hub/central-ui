import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OrderPaymentDialog from './order-payment-dialog';

const mockDispatch = jest.fn();

let mockState;

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));

jest.mock('app/entities/customer/customer.reducer', () => ({
  getEntity: jest.fn(id => ({ type: 'customer/getEntity', payload: id })),
}));

jest.mock('app/entities/settings/on-account/on-account-settings.reducer', () => ({
  getOnAccountSettings: jest.fn(() => ({ type: 'onAccountSettings/get' })),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
}));

beforeEach(() => {
  jest.clearAllMocks();

  mockState = {
    customer: {
      entity: {},
    },
    onAccountSettings: {
      entity: {
        onAccountBalanceType: 'BY_BUSINESS',
      },
      loading: false,
    },
  };

  mockDispatch.mockImplementation(action => action);
});

describe('OrderPaymentDialog', () => {
  it('disables submit for invalid on-account payments', () => {
    render(
      <OrderPaymentDialog
        open
        onOpenChange={jest.fn()}
        title="Create Order & Payment"
        orderBranchId="branch-1"
        customerId="customer-1"
        totalAmount={20}
        totalPaid={0}
        defaultPaymentAmount={20}
        submitLabel="Create Order & Pay"
        onSubmit={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /on account/i }));

    expect(screen.getByText('On Account Validation')).not.toBeNull();
    expect(screen.getByRole('button', { name: /create order & pay/i }).disabled).toBe(true);
  });

  it('submits the entered partial cash payment', () => {
    const onSubmit = jest.fn();

    mockState.customer.entity = {
      id: 'customer-1',
      onAccountEnabled: true,
      onAccountDebitLimit: 100,
      onAccountDebitUsed: 20,
    };

    render(
      <OrderPaymentDialog
        open
        onOpenChange={jest.fn()}
        title="Create Order & Payment"
        orderBranchId="branch-1"
        customerId="customer-1"
        totalAmount={20}
        totalPaid={0}
        defaultPaymentAmount={20}
        submitLabel="Create Order & Pay"
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /create order & pay/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      amount: 5,
      tipAmount: 0,
      transactionMethod: 'cash',
    });
  });

  it('renders previewed charges and uses the final total for remaining balance', () => {
    render(
      <OrderPaymentDialog
        open
        onOpenChange={jest.fn()}
        title="Create Order & Payment"
        orderBranchId="branch-1"
        customerId="customer-1"
        baseOrderTotal={15}
        chargePreviewRows={[
          { key: 'shipping', label: 'Shipping Fee', amount: 3 },
          { key: 'platform', label: 'Platform Fee', amount: 2 },
        ]}
        totalAmount={20}
        totalPaid={0}
        defaultPaymentAmount={20}
        submitLabel="Create Order & Pay"
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByText('Base Total:')).not.toBeNull();
    expect(screen.getByText('Shipping Fee:')).not.toBeNull();
    expect(screen.getByText('Platform Fee:')).not.toBeNull();
    expect(screen.queryByText('Service Charges:')).toBeNull();
    expect(screen.getByText('Final Total:')).not.toBeNull();
    expect(screen.getByText('Remaining:')).not.toBeNull();
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0);
  });

  it('hides zero-value charge rows and summary', () => {
    render(
      <OrderPaymentDialog
        open
        onOpenChange={jest.fn()}
        title="Create Order & Payment"
        orderBranchId="branch-1"
        customerId="customer-1"
        baseOrderTotal={15}
        chargePreviewRows={[
          { key: 'platform', label: 'Platform Fee', amount: 0 },
        ]}
        totalAmount={15}
        totalPaid={0}
        defaultPaymentAmount={15}
        submitLabel="Create Order & Pay"
        onSubmit={jest.fn()}
      />
    );

    expect(screen.queryByText('Platform Fee:')).toBeNull();
    expect(screen.queryByText('Service Charges:')).toBeNull();
  });
});
