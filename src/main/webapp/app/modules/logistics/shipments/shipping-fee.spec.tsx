import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import Shipments from './shipments';
import { fetchShipments, shipOrder } from './shipments.api';
import { IShipmentRow } from './shipments.model';
import { fetchSettings } from '../settings/wholesale-settings.api';
import { requoteShipping, setShippingFee } from '../shipping/shipping.api';

jest.mock('./shipments.api', () => ({
  fetchShipments: jest.fn(),
  shipOrder: jest.fn(),
  deliverOrder: jest.fn(),
}));
jest.mock('../shipping/shipping.api', () => ({ requoteShipping: jest.fn(), setShippingFee: jest.fn() }));
jest.mock('../settings/wholesale-settings.api', () => ({ fetchSettings: jest.fn(), saveSettings: jest.fn() }));
jest.mock('../factories/wholesale-factory.api', () => ({ fetchFactories: jest.fn().mockResolvedValue([]) }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockState = { authentication: { account: { authorities: ['ROLE_WHOLESALE_ADMIN'] } } };
jest.mock('app/config/store', () => ({
  useAppSelector: selector => selector(mockState),
}));

const quoted = (patch: Partial<IShipmentRow> = {}): IShipmentRow => ({
  orderId: 'o7',
  sequenceNumber: 7,
  customerName: 'Cafe Beirut',
  factoryName: 'Main Bakery',
  deliveryDate: '2026-10-06',
  stage: 'READY',
  total: 60,
  shipping: { source: 'EASYPOST', carrier: 'UPS', service: 'Standard', fee: 18, chargedFee: 18, cost: 16, weightKg: 6, packaging: 'PARCEL' },
  ...patch,
});

describe('Shipping fee and labels on Shipments', () => {
  beforeEach(() => {
    jest.mocked(fetchShipments).mockReset().mockResolvedValue([quoted()]);
    jest.mocked(shipOrder).mockReset().mockResolvedValue(quoted({ stage: 'SHIPPED' }));
    jest.mocked(fetchSettings).mockReset().mockResolvedValue({ carriers: [{ id: 'c-1', name: 'Purolator', active: true }] });
    jest.mocked(setShippingFee).mockReset().mockResolvedValue({ fee: 18, overrideFee: 12.5, chargedFee: 12.5 });
    jest.mocked(requoteShipping).mockReset().mockResolvedValue({ source: 'CLICKSHIP', fee: 17, chargedFee: 17 });
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/logistics/shipments']}>
        <Shipments />
      </MemoryRouter>,
    );

  it('shows the fee and where it came from', async () => {
    renderPage();
    const line = await screen.findByTestId('shipment-o7');
    expect(within(line).getByText('$18.00')).toBeTruthy();
    expect(within(line).getByText('EasyPost / UPS Standard')).toBeTruthy();
  });

  it('buys the label from the quoting provider without a tracking number', async () => {
    renderPage();
    const line = await screen.findByTestId('shipment-o7');
    fireEvent.click(within(line).getByText('Ship'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('radio', { name: /Buy the label with EasyPost/ }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(within(dialog).getByText('Buy label and ship'));

    await waitFor(() => expect(shipOrder).toHaveBeenCalledWith('o7', { carrierId: null, trackingNumber: '', notes: null }));
  });

  it('can still ship with a typed tracking number', async () => {
    renderPage();
    fireEvent.click(within(await screen.findByTestId('shipment-o7')).getByText('Ship'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('radio', { name: /Enter a tracking number/ }));
    fireEvent.click(within(dialog).getByText('Ship', { selector: 'button' }));
    expect(await within(dialog).findByText('Enter the tracking number')).toBeTruthy();
    expect(shipOrder).not.toHaveBeenCalled();
  });

  it('offers no label purchase for rate table quotes', async () => {
    jest.mocked(fetchShipments).mockResolvedValue([quoted({ shipping: { source: 'RATE_TABLE', fee: 15, chargedFee: 15 } })]);
    renderPage();
    fireEvent.click(within(await screen.findByTestId('shipment-o7')).getByText('Ship'));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('radio', { name: /Buy the label/ })).toBeNull();
    expect(within(dialog).getByLabelText('Tracking number')).toBeTruthy();
  });

  it('sets a fee by hand and gets a new quote', async () => {
    renderPage();
    fireEvent.click(within(await screen.findByTestId('shipment-o7')).getByText('Fee'));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Fee to charge'), { target: { value: '12.5' } });
    fireEvent.click(within(dialog).getByText('Save fee'));
    await waitFor(() => expect(setShippingFee).toHaveBeenCalledWith('o7', 12.5));
    await waitFor(() => expect(within(dialog).getByText('Get a new quote').closest('button').disabled).toBe(false));

    fireEvent.click(within(dialog).getByText('Get a new quote'));
    await waitFor(() => expect(requoteShipping).toHaveBeenCalledWith('o7'));
  });

  it('keeps the fee button from factories', async () => {
    mockState.authentication.account.authorities = ['ROLE_WHOLESALE_FACTORY'];
    try {
      renderPage();
      const line = await screen.findByTestId('shipment-o7');
      expect(within(line).queryByText('Fee')).toBeNull();
      expect(within(line).getByText('Ship')).toBeTruthy();
    } finally {
      mockState.authentication.account.authorities = ['ROLE_WHOLESALE_ADMIN'];
    }
  });
});
