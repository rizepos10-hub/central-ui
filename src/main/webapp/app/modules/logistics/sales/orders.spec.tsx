import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import Orders from './orders';
import { UnfulfilledOrdersBadge } from './unfulfilled-orders-badge';
import { cancelOrder, fetchUnfulfilledCount, searchOrders } from './order-search.api';
import { IOrderRow, ORDERS_CHANGED_EVENT, ordersLink, searchFromParams } from './order-search.model';

jest.mock('./order-search.api', () => ({
  searchOrders: jest.fn(),
  fetchUnfulfilledCount: jest.fn(),
  fetchUnfulfilledOrders: jest.fn(),
  cancelOrder: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockState = { authentication: { account: { authorities: ['ROLE_WHOLESALE_SALESMAN'] } } };
jest.mock('app/config/store', () => ({
  useAppSelector: selector => selector(mockState),
}));

const row = (id: string, patch: Partial<IOrderRow> = {}): IOrderRow => ({
  id,
  sequenceNumber: Number(id.replace(/\D/g, '')),
  customerId: 'c-1',
  customerName: 'Hayan Abdallah',
  accountNumber: 'A-100',
  deliveryDate: '2026-10-06',
  routeName: 'North',
  stage: 'OPEN',
  paymentStatus: 'UNPAID',
  total: 59.2,
  amountDue: 59.2,
  lines: [{ name: 'White Bread', quantity: 10, price: 2 }],
  cancellable: true,
  ...patch,
});

describe('Orders model', () => {
  it('reads filters from the address with unfulfilled as the default', () => {
    expect(searchFromParams(new URLSearchParams(''), 50)).toEqual({ status: 'UNFULFILLED', payment: 'ANY', page: 0, size: 50 });
    expect(searchFromParams(new URLSearchParams('status=ALL&payment=UNPAID&customerId=c-1&status=x'), 50)).toMatchObject({
      status: 'ALL',
      payment: 'UNPAID',
      customerId: 'c-1',
    });
    expect(searchFromParams(new URLSearchParams('status=BOGUS'), 50).status).toBe('UNFULFILLED');
  });

  it('builds links without the defaults', () => {
    expect(ordersLink({})).toBe('/logistics/orders');
    expect(ordersLink({ status: 'UNFULFILLED', payment: 'ANY', customerId: 'c-1' })).toBe('/logistics/orders?customerId=c-1');
    expect(ordersLink({ status: 'ALL', payment: 'UNPAID', customerId: 'c-1', from: '2026-10-06', to: '2026-10-06' })).toBe(
      '/logistics/orders?status=ALL&payment=UNPAID&customerId=c-1&from=2026-10-06&to=2026-10-06',
    );
  });
});

describe('Orders page', () => {
  beforeEach(() => {
    jest.mocked(searchOrders).mockReset().mockResolvedValue({ rows: [row('o7'), row('o8', { stage: 'WITH_FACTORY', cancellable: false, cancelBlockedReason: 'Amend it' })], total: 2 });
    jest.mocked(cancelOrder).mockReset();
  });

  const renderPage = (url = '/logistics/orders') =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <Orders />
      </MemoryRouter>,
    );

  it('lists unfulfilled orders and filters by status', async () => {
    renderPage();
    expect(await screen.findByText('#7')).toBeTruthy();
    expect(searchOrders).toHaveBeenCalledWith({ status: 'UNFULFILLED', payment: 'ANY', page: 0, size: 50 });
    expect(screen.getByText('2 unfulfilled orders')).toBeTruthy();
    expect(screen.getByText('With factory', { selector: 'span' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delivered' }));
    await waitFor(() => expect(searchOrders).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'DELIVERED' })));
  });

  it('opens with the customer and payment from the address', async () => {
    renderPage('/logistics/orders?status=ALL&payment=UNPAID&customerId=c-1');
    expect(await screen.findByText('#7')).toBeTruthy();
    expect(searchOrders).toHaveBeenCalledWith({ status: 'ALL', payment: 'UNPAID', customerId: 'c-1', page: 0, size: 50 });
    expect(screen.getByLabelText('Show all customers')).toBeTruthy();
  });

  it('shows the items of an order and cancels it', async () => {
    const heard = jest.fn();
    window.addEventListener(ORDERS_CHANGED_EVENT, heard);
    jest.mocked(cancelOrder).mockResolvedValue(row('o7', { stage: 'CANCELLED', cancellable: false }));
    renderPage();
    fireEvent.click(await screen.findByText('#7'));

    expect(screen.getByLabelText('Items of order #7').textContent).toContain('White Bread');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel' }));

    await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith('o7'));
    await waitFor(() => expect(screen.queryByText('#7')).toBeNull());
    expect(heard).toHaveBeenCalled();
    window.removeEventListener(ORDERS_CHANGED_EVENT, heard);
  });

  it('explains why an order with the factory cannot be cancelled', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('#8'));
    expect(screen.getByText('Amend it')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
  });
});

describe('Unfulfilled orders badge', () => {
  it('shows the count and refreshes when orders change', async () => {
    jest.mocked(fetchUnfulfilledCount).mockReset().mockResolvedValueOnce(4).mockResolvedValueOnce(0);
    render(<UnfulfilledOrdersBadge />);
    expect(await screen.findByLabelText('4 unfulfilled')).toBeTruthy();
    act(() => {
      window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
    });
    await waitFor(() => expect(screen.queryByText('4')).toBeNull());
    expect(fetchUnfulfilledCount).toHaveBeenCalledTimes(2);
  });
});
