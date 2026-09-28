import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import WholesaleFactories from './factories';
import { deleteFactory, fetchFactories, saveFactory } from './wholesale-factory.api';
import { IWholesaleFactory, addressFromGoogle, toFactoryPayload, validateFactory } from './wholesale-factory.model';

jest.mock('./wholesale-factory.api', () => ({
  fetchFactories: jest.fn(),
  saveFactory: jest.fn(),
  deleteFactory: jest.fn(),
}));

jest.mock('@vis.gl/react-google-maps', () => ({
  Map: ({ children }: { children?: React.ReactNode }) => <div data-testid="map">{children}</div>,
  Marker: () => <div data-testid="pin" />,
  useMap: () => null,
  useMapsLibrary: () => null,
}));

jest.mock('react-geocode', () => ({ RequestType: { LATLNG: 'latlng' }, geocode: jest.fn(), setKey: jest.fn() }));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), warn: jest.fn() } }));

const windsor: IWholesaleFactory = {
  id: 'f-1',
  name: 'Windsor',
  code: 'WIN',
  latitude: 42.3149,
  longitude: -83.0364,
  orderCutoffTime: '19:00',
  timeZone: 'America/Toronto',
  active: true,
  sendMode: 'MANUAL',
  fulfillmentScreenEnabled: true,
};

const renderPage = (authorities: string[]) => {
  const store = configureStore({
    reducer: { authentication: () => ({ account: { authorities } }) },
  });
  return render(
    <Provider store={store}>
      <WholesaleFactories />
    </Provider>,
  );
};

describe('factory model', () => {
  it('checks the same rules as central', () => {
    expect(validateFactory({ name: ' ' }).name).toBeDefined();
    expect(validateFactory({ name: 'Windsor', orderCutoffTime: '7pm' }).orderCutoffTime).toBeDefined();
    expect(validateFactory({ name: 'Windsor', latitude: 42 }).location).toBe('Set both latitude and longitude, or neither');
    expect(validateFactory({ name: 'Windsor', latitude: 95, longitude: -83 }).location).toBe('Latitude or longitude is out of range');
    expect(validateFactory({ name: 'Windsor', orderCutoffTime: '19:00', latitude: 42.3, longitude: -83 })).toEqual({});
  });

  it('trims the payload, blanks become null, and the pin is copied to the address', () => {
    expect(
      toFactoryPayload({ name: ' Toronto ', code: ' ', orderCutoffTime: '', timeZone: ' America/Toronto ', latitude: 43.65, longitude: -79.38 }),
    ).toMatchObject({
      name: 'Toronto',
      code: null,
      orderCutoffTime: null,
      timeZone: 'America/Toronto',
      address: { latitude: 43.65, longitude: -79.38, fullAddress: null },
      active: true,
      fulfillmentScreenEnabled: false,
    });
  });

  it('reads the address parts from a Google result', () => {
    const part = (long_name: string, ...types: string[]) => ({ long_name, short_name: long_name, types });
    expect(
      addressFromGoogle({
        formatted_address: '100 Queen St W, Toronto, ON M5H 2N2, Canada',
        address_components: [
          part('100', 'street_number'),
          part('Queen Street West', 'route'),
          part('Toronto', 'locality'),
          part('Ontario', 'administrative_area_level_1'),
          part('Canada', 'country'),
          part('M5H 2N2', 'postal_code'),
        ],
      }),
    ).toEqual({
      fullAddress: '100 Queen St W, Toronto, ON M5H 2N2, Canada',
      street: '100 Queen Street West',
      city: 'Toronto',
      state: 'Ontario',
      country: 'Canada',
      postalCode: 'M5H 2N2',
    });
  });
});

describe('Factories page', () => {
  beforeEach(() => {
    jest.mocked(fetchFactories).mockResolvedValue([windsor]);
    jest.mocked(saveFactory).mockReset();
    jest.mocked(deleteFactory).mockReset();
  });

  it('lists the factories with cut-off, send mode and pin', async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    expect(await screen.findByText('Windsor')).toBeTruthy();
    expect(screen.getByText('WIN')).toBeTruthy();
    expect(screen.getByText('19:00')).toBeTruthy();
    expect(screen.getByText('Manually')).toBeTruthy();
    expect(screen.getByLabelText('Pinned')).toBeTruthy();
  });

  it('is read only for sales managers', async () => {
    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Windsor');
    expect(screen.queryByText('New factory')).toBeNull();
    expect(screen.queryByLabelText('Actions for Windsor')).toBeNull();
    fireEvent.click(screen.getByText('Windsor'));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.queryByText('Save')).toBeNull();
  });

  it('creates Toronto with coordinates', async () => {
    const toronto = { ...windsor, id: 'f-2', name: 'Toronto', code: 'TOR', latitude: 43.6532, longitude: -79.3832 };
    jest.mocked(saveFactory).mockResolvedValue(toronto);
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await screen.findByText('Windsor');

    fireEvent.click(screen.getByText('New factory'));
    await screen.findByRole('dialog');
    expect(screen.getByText('America/Toronto (America/Toronto)')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Toronto' } });
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'TOR' } });
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '43.6532' } });
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '-79.3832' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(saveFactory).toHaveBeenCalledTimes(1));
    expect(jest.mocked(saveFactory).mock.calls[0][0]).toMatchObject({
      name: 'Toronto',
      code: 'TOR',
      latitude: 43.6532,
      longitude: -79.3832,
      orderCutoffTime: '19:00',
      timeZone: 'America/Toronto',
      sendMode: 'MANUAL',
    });
    expect(await screen.findByText('Toronto')).toBeTruthy();
  });

  it('does not save without a name', async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await screen.findByText('Windsor');
    fireEvent.click(screen.getByText('New factory'));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByText('Save'));
    expect(await screen.findByText('Enter the factory name')).toBeTruthy();
    expect(saveFactory).not.toHaveBeenCalled();
  });
});
