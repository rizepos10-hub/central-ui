import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import WholesaleCustomers from './customers';
import { fetchRouteDefinitions, fetchWholesaleCustomer, fetchWholesaleCustomers, saveWholesaleProfile, searchRetailCustomers } from './wholesale-customer.api';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { IWholesaleCustomer, nearestFactory, routingAddress, toProfilePayload, validateProfile } from './wholesale-customer.model';

jest.mock('./wholesale-customer.api', () => ({
  fetchWholesaleCustomers: jest.fn(),
  fetchWholesaleCustomer: jest.fn(),
  saveWholesaleProfile: jest.fn(),
  fetchRouteDefinitions: jest.fn(),
  searchRetailCustomers: jest.fn(),
}));

jest.mock('../factories/wholesale-factory.api', () => ({
  fetchFactories: jest.fn(),
  saveFactory: jest.fn(),
  deleteFactory: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const windsor: IWholesaleFactory = { id: 'f-win', name: 'Windsor', active: true, latitude: 42.3149, longitude: -83.0364 };
const toronto: IWholesaleFactory = { id: 'f-tor', name: 'Toronto', active: true, latitude: 43.6532, longitude: -79.3832 };

const cafe: IWholesaleCustomer = {
  id: 'c-1',
  firstName: 'Sam',
  businessName: 'Corner Cafe',
  accountNumber: 'A-100',
  mobileNumber: '519-555-0101',
  deliveryAddresses: [{ id: 'a-1', address: '1 Ouellette Ave, Windsor', latitude: '42.31', longitude: '-83.03', isDefaultAddress: true }],
  wholesaleProfile: {
    defaultRouteId: 'r-1',
    routeStopSequence: 3,
    deliveryDays: ['WEDNESDAY', 'MONDAY'],
    defaultPaymentMethod: 'CREDIT',
    factoryId: 'f-tor',
    suggestedFactoryId: 'f-win',
    factoryOverridden: true,
    active: true,
    allocationPriority: 2,
  },
};

const renderPage = (authorities: string[]) => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <WholesaleCustomers />
      </MemoryRouter>
    </Provider>,
  );
};

describe('wholesale customer model', () => {
  it('checks the delivery window and priority like the server', () => {
    expect(validateProfile({ deliveryWindowStart: '6:30' }).deliveryWindow).toBeDefined();
    expect(validateProfile({ deliveryWindowStart: '09:00', deliveryWindowEnd: '07:00' }).deliveryWindow).toBe('The window ends before it starts');
    expect(validateProfile({ allocationPriority: -1 }).allocationPriority).toBeDefined();
    expect(validateProfile({ deliveryWindowStart: '06:00', deliveryWindowEnd: '09:30', allocationPriority: 0 })).toEqual({});
  });

  it('sends a null factory to follow the suggestion, and keeps a chosen one', () => {
    const profile = { factoryId: 'f-tor', deliveryDays: ['FRIDAY', 'MONDAY'] as any, defaultRouteId: ' ', deliveryWindowStart: '' };
    expect(toProfilePayload(profile, true)).toMatchObject({
      factoryId: null,
      deliveryDays: ['MONDAY', 'FRIDAY'],
      defaultRouteId: null,
      deliveryWindowStart: null,
      active: true,
      cashOnly: false,
    });
    expect(toProfilePayload(profile, false).factoryId).toBe('f-tor');
  });

  it('picks the nearest active factory with a pin from the routing address', () => {
    const addresses = [
      { id: 'a-1', latitude: '43.70', longitude: '-79.40' },
      { id: 'a-2', latitude: '42.30', longitude: '-83.00', isDefaultAddress: true },
    ];
    expect(routingAddress(addresses, null)?.id).toBe('a-2');
    expect(routingAddress(addresses, 'a-1')?.id).toBe('a-1');
    expect(nearestFactory(routingAddress(addresses, null), [windsor, toronto])?.factory.id).toBe('f-win');
    expect(nearestFactory(routingAddress(addresses, 'a-1'), [windsor, toronto])?.factory.id).toBe('f-tor');
    expect(nearestFactory(addresses[0], [windsor, { ...toronto, active: false }])?.factory.id).toBe('f-win');
    expect(nearestFactory({ latitude: '', longitude: '-79' }, [windsor])).toBeUndefined();
  });
});

describe('Wholesale Customers page', () => {
  beforeEach(() => {
    jest.mocked(fetchFactories).mockResolvedValue([windsor, toronto]);
    jest.mocked(fetchRouteDefinitions).mockResolvedValue([{ id: 'r-1', name: 'Windsor North' }]);
    jest.mocked(fetchWholesaleCustomers).mockResolvedValue({ items: [cafe], total: 1 });
    jest.mocked(saveWholesaleProfile).mockReset();
  });

  it('lists route and stop, days, factory override, payment and priority', async () => {
    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    expect(await screen.findByText('Corner Cafe')).toBeTruthy();
    expect(await screen.findByText('Windsor North')).toBeTruthy();
    expect(screen.getByText('#3')).toBeTruthy();
    expect(screen.getByText('Mon Wed')).toBeTruthy();
    expect(screen.getByText('Override')).toBeTruthy();
    expect(screen.getByText('On account')).toBeTruthy();
    expect(screen.getByText('Add wholesale customer')).toBeTruthy();
    expect(jest.mocked(fetchWholesaleCustomers).mock.calls[0][0]).toMatchObject({ page: 0, size: 50, active: undefined });
  });

  it('filters by status on the server', async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await screen.findByText('Corner Cafe');
    fireEvent.click(screen.getByText('paused'));
    await waitFor(() => expect(jest.mocked(fetchWholesaleCustomers).mock.calls.some(([q]) => q.active === false)).toBe(true));
  });

  it('is read only for bookkeepers', async () => {
    renderPage([AUTHORITIES.WHOLESALE_BOOKKEEPER]);
    await screen.findByText('Corner Cafe');
    expect(screen.queryByText('Add wholesale customer')).toBeNull();
    fireEvent.click(screen.getByText('Corner Cafe'));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('turns a retail customer into a wholesale customer that follows the suggested factory', async () => {
    const bakery: IWholesaleCustomer = {
      id: 'c-2',
      businessName: 'Queen St Bakery',
      deliveryAddresses: [{ id: 'a-9', address: 'Queen St W, Toronto', latitude: '43.65', longitude: '-79.40', isDefaultAddress: true }],
      wholesaleProfile: null,
    };
    jest.mocked(searchRetailCustomers).mockResolvedValue([{ id: 'c-2', businessName: 'Queen St Bakery' }]);
    jest.mocked(fetchWholesaleCustomer).mockResolvedValue(bakery);
    jest.mocked(saveWholesaleProfile).mockResolvedValue({ ...bakery, wholesaleProfile: { factoryId: 'f-tor' } });

    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Corner Cafe');
    fireEvent.click(screen.getByText('Add wholesale customer'));
    fireEvent.change(await screen.findByLabelText('Search customers'), { target: { value: 'Queen' } });
    fireEvent.click(await screen.findByText('Queen St Bakery'));

    expect(await screen.findByText('Make Queen St Bakery a wholesale customer')).toBeTruthy();
    expect(screen.getByText(/Suggested: Toronto/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fri' }));
    fireEvent.click(screen.getByText('Make wholesale customer'));

    await waitFor(() => expect(saveWholesaleProfile).toHaveBeenCalledTimes(1));
    expect(jest.mocked(saveWholesaleProfile).mock.calls[0]).toEqual([
      'c-2',
      expect.objectContaining({ factoryId: null, deliveryDays: ['MONDAY', 'FRIDAY'], active: true, defaultOrderMethod: 'Delivery' }),
    ]);
  });
});
