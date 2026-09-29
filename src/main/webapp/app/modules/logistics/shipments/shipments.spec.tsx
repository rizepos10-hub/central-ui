import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import Shipments from './shipments';
import { deliverOrder, fetchShipments, shipOrder } from './shipments.api';
import { IShipmentRow, shipmentErrors } from './shipments.model';
import { fetchSettings } from '../settings/wholesale-settings.api';
import { carrierError, toSettingsPayload, validateSettings } from '../settings/wholesale-settings.model';
import { carrierLabel } from '../operations/operations.model';
import { toRoutePayload, newRoute } from '../route-definitions/route-definition.model';
import { carrierCustomerProblem } from '../customers/carrier-customer-fields';

jest.mock('./shipments.api', () => ({
  fetchShipments: jest.fn(),
  shipOrder: jest.fn(),
  deliverOrder: jest.fn(),
}));
jest.mock('../settings/wholesale-settings.api', () => ({ fetchSettings: jest.fn(), saveSettings: jest.fn() }));
jest.mock('../factories/wholesale-factory.api', () => ({
  fetchFactories: jest.fn().mockResolvedValue([{ id: 'f-1', name: 'Main Bakery', active: true }]),
}));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockState = { authentication: { account: { authorities: ['ROLE_WHOLESALE_ADMIN'] } } };
jest.mock('app/config/store', () => ({
  useAppSelector: selector => selector(mockState),
}));

const row = (orderId: string, patch: Partial<IShipmentRow> = {}): IShipmentRow => ({
  orderId,
  sequenceNumber: Number(orderId.replace(/\D/g, '')),
  customerName: 'Cafe Beirut',
  factoryName: 'Main Bakery',
  deliveryDate: '2026-10-06',
  stage: 'READY',
  total: 42,
  ...patch,
});

describe('Carrier shipping rules', () => {
  it('checks carriers and cut-off times in the settings', () => {
    expect(carrierError([{ name: 'Purolator', trackingUrl: 'https://purolator.com/t?n={tracking}' }])).toBeUndefined();
    expect(carrierError([{ name: ' ' }])).toBe('Every carrier needs a name');
    expect(carrierError([{ name: 'UPS' }, { name: 'ups ' }])).toContain('unique');
    expect(carrierError([{ name: 'UPS', trackingUrl: 'ups.com' }])).toContain('http');
    expect(
      validateSettings({
        staleCreditPercent: 100,
        carrierShippingEnabled: true,
        carrierDispatch: 'AT_CUTOFF_TIMES',
        carrierCutoffTimes: [],
      }).carrierCutoffTimes
    ).toBe('Add at least one cut-off time');
    expect(
      validateSettings({ staleCreditPercent: 100, carrierShippingEnabled: false, carrierDispatch: 'AT_CUTOFF_TIMES' }).carrierCutoffTimes
    ).toBeUndefined();
    expect(toSettingsPayload({ carriers: [{ name: ' UPS ', trackingUrl: ' ' }], carrierCutoffTimes: ['14:00', '09:30'] })).toMatchObject({
      carriers: [{ name: 'UPS', trackingUrl: null }],
      carrierCutoffTimes: ['09:30', '14:00'],
    });
  });

  it('opens carrier routes every day without a driver', () => {
    const payload = toRoutePayload({
      ...newRoute(),
      name: 'Ship',
      carrierShipping: true,
      deliveryDays: ['MONDAY'],
      defaultDriverUserId: 'd-1',
    });
    expect(payload.deliveryDays).toHaveLength(7);
    expect(payload.defaultDriverUserId).toBeNull();
    const normal = toRoutePayload({ ...newRoute(), name: 'North', deliveryDays: ['MONDAY'], defaultDriverUserId: 'd-1' });
    expect(normal).toMatchObject({ deliveryDays: ['MONDAY'], defaultDriverUserId: 'd-1', carrierShipping: false });
  });

  it('needs carrier customers on account and not cash only', () => {
    expect(carrierCustomerProblem({ cashOnly: true, defaultPaymentMethod: 'CREDIT' })).toContain('Cash-only');
    expect(carrierCustomerProblem({ defaultPaymentMethod: 'CASH' })).toContain('On account');
    expect(carrierCustomerProblem({ defaultPaymentMethod: 'CREDIT' })).toBeNull();
  });

  it('labels carrier factory orders and checks the ship form', () => {
    expect(carrierLabel(null)).toBeNull();
    expect(carrierLabel('order-o1')).toBe('Carrier order');
    expect(carrierLabel('cutoff-2026-10-06T14:00')).toBe('Carrier cut-off 14:00');
    expect(shipmentErrors({ carrierId: null, trackingNumber: ' ' })).toEqual({
      carrierId: 'Choose the carrier',
      trackingNumber: 'Enter the tracking number',
    });
    expect(shipmentErrors({ carrierId: 'c-1', trackingNumber: '1Z' })).toEqual({});
  });
});

describe('Shipments page', () => {
  beforeEach(() => {
    jest
      .mocked(fetchShipments)
      .mockReset()
      .mockResolvedValue([row('o7', { carrierId: 'c-1' })]);
    jest
      .mocked(shipOrder)
      .mockReset()
      .mockResolvedValue(row('o7', { stage: 'SHIPPED' }));
    jest
      .mocked(deliverOrder)
      .mockReset()
      .mockResolvedValue(row('o8', { stage: 'DELIVERED' }));
    jest
      .mocked(fetchSettings)
      .mockReset()
      .mockResolvedValue({
        carriers: [
          { id: 'c-1', name: 'Purolator', active: true },
          { id: 'c-2', name: 'UPS', active: false },
        ],
      });
  });

  const renderPage = (url = '/logistics/shipments') =>
    render(
      <MemoryRouter initialEntries={[url]}>
        <Shipments />
      </MemoryRouter>
    );

  it('ships a ready order with the customer carrier and a tracking number', async () => {
    renderPage();
    const line = await screen.findByTestId('shipment-o7');
    expect(fetchShipments).toHaveBeenCalledWith({ stage: 'READY', factoryId: undefined });
    fireEvent.click(within(line).getByText('Ship'));

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByLabelText('Carrier').textContent).toContain('Purolator'));
    fireEvent.click(within(dialog).getByText('Ship', { selector: 'button' }));
    expect(await within(dialog).findByText('Enter the tracking number')).toBeTruthy();
    expect(shipOrder).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('Tracking number'), { target: { value: ' 1Z999 ' } });
    fireEvent.click(within(dialog).getByText('Ship', { selector: 'button' }));
    await waitFor(() => expect(shipOrder).toHaveBeenCalledWith('o7', { carrierId: 'c-1', trackingNumber: '1Z999', notes: null }));
  });

  it('marks a shipped order delivered from the Shipped tab', async () => {
    jest
      .mocked(fetchShipments)
      .mockResolvedValue([
        row('o8', {
          stage: 'SHIPPED',
          carrierName: 'Purolator',
          trackingNumber: '1Z8',
          trackingUrl: 'https://p.com/t?n=1Z8',
          shippedAt: '2026-10-06T10:00:00Z',
        }),
      ]);
    renderPage('/logistics/shipments?stage=SHIPPED');
    const line = await screen.findByTestId('shipment-o8');
    expect(fetchShipments).toHaveBeenCalledWith({ stage: 'SHIPPED', factoryId: undefined });
    expect(within(line).getByText('1Z8').closest('a').getAttribute('href')).toBe('https://p.com/t?n=1Z8');

    fireEvent.click(within(line).getByText('Delivered'));
    fireEvent.click(await screen.findByText('Mark delivered'));
    await waitFor(() => expect(deliverOrder).toHaveBeenCalledWith('o8', ''));
  });

  it('hides actions from roles that cannot take them', async () => {
    mockState.authentication.account.authorities = ['ROLE_WHOLESALE_SALES_MANAGER'];
    try {
      renderPage();
      const line = await screen.findByTestId('shipment-o7');
      expect(within(line).queryByText('Ship')).toBeNull();
    } finally {
      mockState.authentication.account.authorities = ['ROLE_WHOLESALE_ADMIN'];
    }
  });
});
