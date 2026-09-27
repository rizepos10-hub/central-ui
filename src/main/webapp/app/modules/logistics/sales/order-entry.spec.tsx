import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import OrderEntry, { printableOrder } from './order-entry';
import {
  fetchCatalog,
  fetchCreditStatus,
  fetchItemHistory,
  fetchOrderEntryCustomers,
  fetchOrderRegisters,
  fetchSuggestedOrder,
  placeWholesaleOrder,
} from './sales.api';
import { fetchRouteDefinitions, fetchWholesaleCustomer } from '../customers/wholesale-customer.api';
import { ICatalogItem, IOrderEntryCustomer, buildEntryRows, creditWarning, initialQuantities, toPlacementRequest } from './sales.model';

jest.mock('./sales.api', () => ({
  fetchCatalog: jest.fn(),
  fetchCreditStatus: jest.fn(),
  fetchItemHistory: jest.fn(),
  fetchOrderEntryCustomers: jest.fn(),
  fetchOrderRegisters: jest.fn(),
  fetchSuggestedOrder: jest.fn(),
  placeWholesaleOrder: jest.fn(),
  saveRouteOverride: jest.fn(),
  createCustomerNote: jest.fn(),
}));

jest.mock('../customers/wholesale-customer.api', () => ({
  fetchRouteDefinitions: jest.fn(),
  fetchWholesaleCustomer: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const catalog: ICatalogItem[] = [
  { itemId: 'bread', name: 'White Bread', categories: [], orderable: true, variants: [{ id: 'loaf', name: 'Loaf', price: 2 }] },
  { itemId: 'rolls', name: 'Rolls', categories: [], orderable: true, variants: [{ id: 'six', name: '6 pack', price: 3 }] },
  { itemId: 'cake', name: 'Cake', categories: [], orderable: false, variants: [{ id: 'whole', name: 'Whole', price: 20 }] },
  { itemId: 'pie', name: 'Pie', categories: [], orderable: true, variants: [{ id: 'p', name: 'Pie', price: 9 }] },
];

const entryCustomer = (id: string, name: string, patch: Partial<IOrderEntryCustomer> = {}): IOrderEntryCustomer => ({
  customerId: id,
  name,
  routeId: 'r-1',
  defaultRouteId: 'r-1',
  stopSequence: 1,
  deliveryDay: true,
  orderIds: [],
  blocked: false,
  ...patch,
});

describe('order entry model', () => {
  const rows = buildEntryRows(
    catalog,
    [{ itemId: 'bread', quantity: 10, notes: 'sliced' }],
    [{ itemId: 'rolls', variantId: 'six', lastQuantity: 4, timesOrdered: 3 }],
  );

  it('groups the usual order, previous items and the rest', () => {
    expect(rows.map(r => [r.itemId, r.group])).toEqual([
      ['bread', 'usual'],
      ['rolls', 'previous'],
      ['cake', 'other'],
      ['pie', 'other'],
    ]);
    expect(initialQuantities(rows)).toEqual({ 'bread:loaf': 10 });
  });

  it('builds the placement request with only the entered lines', () => {
    const request = toPlacementRequest({
      customer: { id: 'c-1', businessName: 'Corner Cafe', deliveryAddresses: [{ id: 'a-1', address: '1 Main', isDefaultAddress: true }] },
      entryCustomer: entryCustomer('c-1', 'Corner Cafe'),
      branchId: 'b-1',
      tillId: 't-1',
      deliveryDate: '2026-10-06',
      orderMethod: 'Delivery',
      rows,
      quantities: { 'bread:loaf': 10, 'rolls:six': 2, 'cake:whole': 1 },
      itemNotes: { 'bread:loaf': ' sliced ' },
      notes: ' back door ',
      source: 'SALESPERSON',
    });
    expect(request.items).toEqual([
      { itemId: 'bread', variantId: 'loaf', amount: 10, price: 2, notes: 'sliced' },
      { itemId: 'rolls', variantId: 'six', amount: 2, price: 3 },
    ]);
    expect(request).toMatchObject({
      branchId: 'b-1',
      tillId: 't-1',
      wholesale: true,
      deliverTo: { id: 'a-1' },
      customer: { id: 'c-1', businessDetails: { businessName: 'Corner Cafe' } },
      wholesaleDetails: { deliveryDate: '2026-10-06', source: 'SALESPERSON', autoFilled: true, notes: 'back door' },
    });
  });

  it('warns about the credit limit and unpaid orders', () => {
    expect(creditWarning({ customerId: 'c', onAccountEnabled: true, unlimited: false, overLimit: true, debitUsed: 120, debitLimit: 100, unpaidOrders: 0 })).toBe(
      'Over the credit limit: $120.00 used of $100.00.',
    );
    expect(
      creditWarning({ customerId: 'c', onAccountEnabled: true, unlimited: false, overLimit: false, unpaidOrders: 2, unpaidTotal: 50, oldestUnpaidDate: '2026-09-01' }),
    ).toBe('2 unpaid orders ($50.00), oldest 2026-09-01.');
    expect(creditWarning({ customerId: 'c', onAccountEnabled: false, unlimited: false, overLimit: false, unpaidOrders: 0 })).toBeUndefined();
  });

  it('escapes the printable order', () => {
    expect(printableOrder('A & B', '2026-10-06', [{ name: '<b>', quantity: 1 }], '')).toContain('A &amp; B');
    expect(printableOrder('A', '2026-10-06', [{ name: '<b>', quantity: 1 }], '')).toContain('&lt;b&gt;');
  });
});

describe('Order Entry page', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.mocked(fetchRouteDefinitions).mockResolvedValue([{ id: 'r-1', name: 'North', active: true }]);
    jest.mocked(fetchCatalog).mockResolvedValue(catalog);
    jest.mocked(fetchOrderRegisters).mockResolvedValue([{ id: 'reg-1', name: 'Online', branchId: 'b-1', branchName: 'Main', tillId: 't-1' }]);
    jest.mocked(fetchOrderEntryCustomers).mockResolvedValue([
      entryCustomer('c-1', 'Corner Cafe'),
      entryCustomer('c-2', 'Deli Two', { stopSequence: 2, deliveryDay: false }),
    ]);
    jest.mocked(fetchWholesaleCustomer).mockImplementation(id => Promise.resolve({ id, businessName: id === 'c-1' ? 'Corner Cafe' : 'Deli Two' }));
    jest.mocked(fetchSuggestedOrder).mockResolvedValue({ customerId: 'c-1', date: '2026-10-06', deliveryDay: true, scheduledDates: [], lines: [{ itemId: 'bread', quantity: 10 }] });
    jest.mocked(fetchItemHistory).mockResolvedValue([{ itemId: 'rolls', variantId: 'six', lastQuantity: 4, timesOrdered: 2 }]);
    jest.mocked(fetchCreditStatus).mockResolvedValue({ customerId: 'c-1', onAccountEnabled: true, unlimited: false, overLimit: true, debitUsed: 150, debitLimit: 100, unpaidOrders: 1 });
    jest.mocked(placeWholesaleOrder).mockReset().mockResolvedValue({ id: 'o-1' });
  });

  const renderPage = (url = '/logistics/order-entry?date=2026-10-06') =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <OrderEntry />
      </MemoryRouter>,
    );

  it('pre-fills the usual order, shows last quantities and warnings, then saves and moves on', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Corner Cafe'));

    const bread = await screen.findByLabelText('Quantity White Bread');
    expect((bread as HTMLInputElement).value).toBe('10');
    expect(screen.getByLabelText<HTMLInputElement>('Quantity Rolls').placeholder).toBe('4');
    expect(screen.getByText(/Over the credit limit/)).toBeTruthy();
    expect(screen.queryByLabelText('Quantity Cake')).toBeNull();

    fireEvent.change(screen.getByLabelText('Quantity Rolls'), { target: { value: '3' } });
    fireEvent.click(screen.getByText('Save & Next'));

    await waitFor(() => expect(placeWholesaleOrder).toHaveBeenCalledTimes(1));
    expect(jest.mocked(placeWholesaleOrder).mock.calls[0][0]).toMatchObject({
      branchId: 'b-1',
      items: [
        { itemId: 'bread', amount: 10 },
        { itemId: 'rolls', amount: 3 },
      ],
      wholesaleDetails: { deliveryDate: '2026-10-06', source: 'SALESPERSON' },
    });
    expect(await screen.findByText(/is not one of this customer/)).toBeTruthy();
  });

  it('shows other-category items read only once expanded', async () => {
    renderPage('/logistics/order-entry?date=2026-10-06&customerId=c-1');
    await screen.findByLabelText('Quantity White Bread');
    fireEvent.click(screen.getByText(/Other items/));
    expect(screen.getByLabelText<HTMLInputElement>('Quantity Cake').disabled).toBe(true);
    expect(screen.getByText('(other category)')).toBeTruthy();
  });

  it('needs at least one quantity', async () => {
    jest.mocked(fetchSuggestedOrder).mockResolvedValue({ customerId: 'c-1', date: '2026-10-06', deliveryDay: true, scheduledDates: [], lines: [] });
    renderPage('/logistics/order-entry?date=2026-10-06&customerId=c-1');
    await screen.findByLabelText('Quantity Rolls');
    expect(screen.queryByLabelText('Quantity White Bread')).toBeNull();
    fireEvent.click(screen.getByText('Save'));
    expect(placeWholesaleOrder).not.toHaveBeenCalled();
  });
});
