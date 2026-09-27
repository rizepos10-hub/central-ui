import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import WholesaleRouteDefinitions from './route-definitions';
import { fetchDrivers, fetchRoutes, fetchStops, optimizeRoute, saveRoute, saveStopOrder } from './route-definition.api';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IRouteMember, moveItem, orderByIds, toRoutePayload } from './route-definition.model';

jest.mock('./route-definition.api', () => ({
  fetchRoutes: jest.fn(),
  saveRoute: jest.fn(),
  deleteRoute: jest.fn(),
  fetchStops: jest.fn(),
  addStop: jest.fn(),
  removeStop: jest.fn(),
  saveStopOrder: jest.fn(),
  optimizeRoute: jest.fn(),
  fetchDrivers: jest.fn(),
}));

jest.mock('../factories/wholesale-factory.api', () => ({ fetchFactories: jest.fn(), saveFactory: jest.fn(), deleteFactory: jest.fn() }));
jest.mock('../customers/wholesale-customer.api', () => ({ fetchWholesaleCustomers: jest.fn().mockResolvedValue({ items: [], total: 0 }) }));

jest.mock('@vis.gl/react-google-maps', () => ({
  Map: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Marker: ({ title, label }: { title?: string; label?: { text: string } }) => (
    <span data-testid="marker" data-label={label?.text}>
      {title}
    </span>
  ),
  useMap: () => null,
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

const stop = (customerId: string, name: string, lat?: number): IRouteMember => ({
  customerId,
  businessName: name,
  latitude: lat ?? null,
  longitude: lat == null ? null : -83,
  active: true,
});

const cafe = stop('c-1', 'Corner Cafe', 42.31);
const deli = stop('c-2', 'Main Deli', 42.35);
const bistro = stop('c-3', 'Lake Bistro', 42.2);

const markerTitles = () => screen.getAllByTestId('marker').map(m => m.textContent);

const renderPage = (authorities: string[]) => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <WholesaleRouteDefinitions />
    </Provider>,
  );
};

describe('route model', () => {
  it('moves an item and orders by a proposal, keeping unknown stops at the end', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(['a', 'b'], 0, 5)).toEqual(['a', 'b']);
    expect(orderByIds([cafe, deli, bistro], ['c-3', 'c-1']).map(s => s.customerId)).toEqual(['c-3', 'c-1', 'c-2']);
  });

  it('builds the route payload', () => {
    expect(
      toRoutePayload({ name: ' North ', code: '', deliveryDays: ['FRIDAY', 'MONDAY'], defaultDriverUsername: ' ', salesmanIds: ['s-1'] }),
    ).toMatchObject({ name: 'North', code: null, deliveryDays: ['MONDAY', 'FRIDAY'], defaultDriverUsername: null, active: true, salesmanIds: ['s-1'] });
  });
});

describe('Route Setup page', () => {
  beforeEach(() => {
    jest.mocked(fetchFactories).mockResolvedValue([{ id: 'f-win', name: 'Windsor', active: true, latitude: 42.31, longitude: -83.03 }]);
    jest.mocked(fetchDrivers).mockResolvedValue([{ username: 'driver1', firstName: 'Dana' }]);
    jest.mocked(fetchRoutes).mockResolvedValue([
      { id: 'r-1', name: 'Windsor North', factoryId: 'f-win', deliveryDays: ['MONDAY'], defaultDriverUsername: 'driver1', active: true },
    ]);
    jest.mocked(fetchStops).mockResolvedValue([cafe, deli, bistro]);
    jest.mocked(saveStopOrder).mockReset();
    jest.mocked(saveRoute).mockReset();
  });

  it('shows the stops and numbers the map the same way, starting at the factory', async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    expect(await screen.findByText('Main Deli')).toBeTruthy();
    expect(screen.getAllByText(/Dana \(driver1\)/).length).toBeGreaterThan(0);
    expect(markerTitles()).toEqual(['Windsor (start)', '1. Corner Cafe', '2. Main Deli', '3. Lake Bistro']);
  });

  it('saves a reordered route and the map follows the saved order', async () => {
    jest.mocked(saveStopOrder).mockResolvedValue([deli, cafe, bistro]);
    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Main Deli');

    fireEvent.click(screen.getByLabelText('Move Corner Cafe down'));
    expect(markerTitles()).toEqual(['Windsor (start)', '1. Main Deli', '2. Corner Cafe', '3. Lake Bistro']);
    expect(screen.getByText('The new order is not saved yet.')).toBeTruthy();
    expect(screen.queryByText('Add stop')).toBeNull();

    fireEvent.click(screen.getByText('Save order'));
    await waitFor(() => expect(saveStopOrder).toHaveBeenCalledWith('r-1', ['c-2', 'c-1', 'c-3']));
    await waitFor(() => expect(screen.queryByText('The new order is not saved yet.')).toBeNull());
    expect(markerTitles()).toEqual(['Windsor (start)', '1. Main Deli', '2. Corner Cafe', '3. Lake Bistro']);
  });

  it('proposes a shorter order and applies it only when chosen', async () => {
    jest.mocked(optimizeRoute).mockResolvedValue({
      routeDefinitionId: 'r-1',
      originFactoryId: 'f-win',
      customerIds: ['c-3', 'c-1', 'c-2'],
      unlocatedCustomerIds: [],
      currentKm: 30.2,
      proposedKm: 21.7,
    });
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await screen.findByText('Main Deli');

    fireEvent.click(screen.getByText('Optimise'));
    expect(await screen.findByText('21.7 km')).toBeTruthy();
    expect(markerTitles()[1]).toBe('1. Corner Cafe');

    fireEvent.click(screen.getByText('Use this order'));
    expect(markerTitles()).toEqual(['Windsor (start)', '1. Lake Bistro', '2. Corner Cafe', '3. Main Deli']);
    expect(screen.getByText('Save order')).toBeTruthy();
    expect(saveStopOrder).not.toHaveBeenCalled();
  });

  it('is read only for bookkeepers', async () => {
    renderPage([AUTHORITIES.WHOLESALE_BOOKKEEPER]);
    await screen.findByText('Main Deli');
    expect(screen.queryByText('New route')).toBeNull();
    expect(screen.queryByText('Add stop')).toBeNull();
    expect(screen.queryByText('Optimise')).toBeNull();
    expect(screen.queryByLabelText('Move Corner Cafe down')).toBeNull();
  });

  it('creates a route', async () => {
    jest.mocked(saveRoute).mockResolvedValue({ id: 'r-2', name: 'Toronto East', active: true });
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await screen.findByText('Main Deli');

    fireEvent.click(screen.getByText('New route'));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Enter the route name')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Toronto East' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tue' }));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(saveRoute).toHaveBeenCalledWith(expect.objectContaining({ name: 'Toronto East', deliveryDays: ['TUESDAY'], active: true })));
    expect((await screen.findAllByText('Toronto East')).length).toBe(2);
  });
});
