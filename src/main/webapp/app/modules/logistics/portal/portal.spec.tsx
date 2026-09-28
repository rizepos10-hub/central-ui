import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import PortalShop from './portal-shop';
import { PortalAccessDialog } from './portal-access-dialog';
import {
  cancelOrder,
  changePassword,
  fetchCatalog,
  fetchDays,
  fetchMe,
  fetchOrders,
  fetchPortalAccess,
  placeOrder,
  previewOrder,
  savePortalAccess,
} from './portal.api';
import { fetchAssignableCategories } from '../salesmen/salesman.api';
import {
  IPortalCatalog,
  USUAL,
  cartFromLines,
  cartLines,
  estimateTotal,
  isPortalCustomer,
  portalUrl,
  sameCart,
  setQuantity,
  validatePassword,
  visibleItems,
} from './portal.model';

jest.mock('./portal.api', () => ({
  fetchMe: jest.fn(),
  changePassword: jest.fn(),
  fetchDays: jest.fn(),
  fetchCatalog: jest.fn(),
  fetchOrders: jest.fn(),
  previewOrder: jest.fn(),
  placeOrder: jest.fn(),
  cancelOrder: jest.fn(),
  fetchPortalFeed: jest.fn(),
  fetchPortalAccess: jest.fn(),
  savePortalAccess: jest.fn(),
}));
jest.mock('../salesmen/salesman.api', () => ({ fetchAssignableCategories: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const catalog: IPortalCatalog = {
  date: '2026-10-06',
  categories: [
    { id: 'breads', name: 'Breads' },
    { id: 'cakes', name: 'Cakes' },
  ],
  items: [
    { itemId: 'loaf', name: 'White Loaf', categoryIds: ['breads'], variants: [{ id: 'v-loaf', name: 'White Loaf', price: 2.5 }] },
    {
      itemId: 'cake',
      name: 'Carrot Cake',
      categoryIds: ['cakes'],
      variants: [
        { id: 'small', name: 'Small', price: 10 },
        { id: 'large', name: 'Large', price: 18 },
      ],
    },
  ],
  usualLines: [{ itemId: 'loaf', variantId: 'v-loaf', quantity: 4 }],
};

describe('portal model', () => {
  it('knows a portal-only user from staff', () => {
    expect(isPortalCustomer(['ROLE_WHOLESALE_CUSTOMER'])).toBe(true);
    expect(isPortalCustomer(['ROLE_WHOLESALE_CUSTOMER', 'ROLE_WHOLESALE_ADMIN'])).toBe(false);
    expect(isPortalCustomer(['ROLE_ADMINISTRATOR'])).toBe(false);
    expect(isPortalCustomer(undefined)).toBe(false);
  });

  it('keeps whole quantities and drops zero lines', () => {
    let cart = cartFromLines([{ itemId: 'loaf', variantId: 'v-loaf', quantity: 2 }, { itemId: 'loaf', variantId: 'v-loaf', quantity: 1 }]);
    expect(cart).toEqual({ 'loaf|v-loaf': 3 });
    cart = setQuantity(cart, 'cake|small', 2.7);
    cart = setQuantity(cart, 'loaf|v-loaf', 0);
    expect(cart).toEqual({ 'cake|small': 2 });
    expect(setQuantity({}, 'cake|small', 99999)['cake|small']).toBe(10000);
    expect(cartLines({ 'cake|small': 2, 'x|': 1 })).toEqual([
      { itemId: 'cake', variantId: 'small', quantity: 2 },
      { itemId: 'x', variantId: null, quantity: 1 },
    ]);
    expect(sameCart({ a: 1 }, { a: 1, b: 0 })).toBe(true);
    expect(estimateTotal({ 'loaf|v-loaf': 2, 'cake|large': 1 }, catalog.items)).toBe(23);
  });

  it('shows usual items, a category, or search results across categories', () => {
    expect(visibleItems(catalog, USUAL, '').map(i => i.itemId)).toEqual(['loaf']);
    expect(visibleItems(catalog, 'cakes', '').map(i => i.itemId)).toEqual(['cake']);
    expect(visibleItems(catalog, USUAL, 'large').map(i => i.itemId)).toEqual(['cake']);
  });

  it('checks the new password and builds the sign-in link', () => {
    expect(validatePassword('short', 'short')).toMatch(/8 characters/);
    expect(validatePassword('longenough', 'different')).toMatch(/match/);
    expect(validatePassword('longenough', 'longenough')).toBeNull();
    expect(portalUrl('https://app.example.com', '/acme/logistics/customers')).toBe('https://app.example.com/acme/portal');
  });
});

const renderShop = () =>
  render(
    <MemoryRouter>
      <PortalShop />
    </MemoryRouter>,
  );

describe('portal shop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchMe as jest.Mock).mockResolvedValue({ customerId: 'c1', name: 'Corner Cafe', orderingReady: true, mustChangePassword: false });
    (fetchDays as jest.Mock).mockResolvedValue([
      { date: '2026-10-05', cutoffAt: '2026-10-04T13:00:00Z', closedReason: 'CUTOFF_PASSED' },
      { date: '2026-10-06', cutoffAt: '2026-10-05T13:00:00Z', closedReason: null },
    ]);
    (fetchOrders as jest.Mock).mockResolvedValue([]);
    (fetchCatalog as jest.Mock).mockResolvedValue(catalog);
    (previewOrder as jest.Mock).mockResolvedValue({ subtotal: 10, tax: 1, total: 11 });
    (placeOrder as jest.Mock).mockResolvedValue({ id: 'o1' });
  });

  it('opens on the first open day with the usual items prefilled, and places the order', async () => {
    renderShop();

    expect(await screen.findByRole('heading', { name: 'Corner Cafe' })).toBeTruthy();
    await waitFor(() => expect(fetchCatalog).toHaveBeenCalledWith('2026-10-06'));
    const loaf = await screen.findByRole('article', { name: 'White Loaf' });
    await waitFor(() => expect(within(loaf).getByLabelText<HTMLInputElement>('White Loaf quantity').value).toBe('4'));

    fireEvent.click(screen.getByRole('button', { name: /Cakes/ }));
    const cake = screen.getByRole('article', { name: 'Carrot Cake' });
    fireEvent.click(within(cake).getByLabelText('More Carrot Cake Large'));

    const aside = screen.getAllByRole('button', { name: 'Place order' })[0];
    fireEvent.click(aside);

    await waitFor(() =>
      expect(placeOrder).toHaveBeenCalledWith('2026-10-06', [
        { itemId: 'loaf', variantId: 'v-loaf', quantity: 4 },
        { itemId: 'cake', variantId: 'large', quantity: 1 },
      ]),
    );
  });

  it('locks a day after the cut-off', async () => {
    renderShop();
    fireEvent.click((await screen.findAllByRole('tab'))[0]);

    await waitFor(() => expect(fetchCatalog).toHaveBeenCalledWith('2026-10-05'));
    expect((await screen.findAllByText(/Ordering is closed for this day/)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Place order' })).toBeNull();
  });

  it('asks for a new password before showing the shop', async () => {
    (fetchMe as jest.Mock)
      .mockResolvedValueOnce({ customerId: 'c1', name: 'Corner Cafe', orderingReady: true, mustChangePassword: true })
      .mockResolvedValue({ customerId: 'c1', name: 'Corner Cafe', orderingReady: true, mustChangePassword: false });
    (changePassword as jest.Mock).mockResolvedValue(undefined);
    renderShop();

    fireEvent.change(await screen.findByLabelText('New password'), { target: { value: 'mysecret1' } });
    fireEvent.change(screen.getByLabelText('Repeat the password'), { target: { value: 'mysecret1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith('mysecret1'));
    expect(await screen.findByRole('article', { name: 'White Loaf' })).toBeTruthy();
    expect(fetchDays).toHaveBeenCalledTimes(1);
  });

  it('cancels an upcoming order after confirming', async () => {
    (fetchOrders as jest.Mock).mockResolvedValue([
      { id: 'o1', deliveryDate: '2026-10-06', lines: [{ itemId: 'loaf', variantId: 'v-loaf', name: 'White Loaf', quantity: 2 }], total: 5, closedReason: null },
    ]);
    (cancelOrder as jest.Mock).mockResolvedValue(undefined);
    renderShop();

    const cancel = await screen.findAllByRole('button', { name: 'Cancel' });
    fireEvent.click(cancel[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));

    await waitFor(() => expect(cancelOrder).toHaveBeenCalledWith('o1'));
  });
});

describe('portal access dialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchAssignableCategories as jest.Mock).mockResolvedValue([
      { id: 'breads', name: 'Breads' },
      { id: 'cakes', name: 'Cakes' },
    ]);
  });

  it('needs a temporary password for new access and emails the sign-in', async () => {
    (fetchPortalAccess as jest.Mock).mockResolvedValue({ customerId: 'c1', enabled: false, categoryIds: [] });
    (savePortalAccess as jest.Mock).mockResolvedValue({ customerId: 'c1', enabled: true, email: 'cafe@example.com', categoryIds: ['breads'] });
    const onClose = jest.fn();
    render(<PortalAccessDialog customer={{ id: 'c1', name: 'Corner Cafe', email: 'cafe@example.com' }} readOnly={false} onClose={onClose} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Give access' }));
    expect(await screen.findByText('Set a temporary password')).toBeTruthy();
    expect(savePortalAccess).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'welcome123' } });
    fireEvent.click(within(screen.getByRole('group', { name: 'Portal categories' })).getByRole('checkbox', { name: 'Breads' }));
    fireEvent.click(screen.getByRole('button', { name: 'Give access' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(savePortalAccess).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ email: 'cafe@example.com', password: 'welcome123', enabled: true, categoryIds: ['breads'], sendInvite: true }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
