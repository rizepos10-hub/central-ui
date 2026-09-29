import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ShippingSettings from './shipping-settings';
import { fetchClickShipPaymentMethods, fetchShippingSettings, saveShippingSettings, testShippingProvider } from './shipping.api';
import { IShippingSettings, newRateRow, quoteSource, toDraft, toShippingPayload, validateShipping } from './shipping.model';
import { WHOLESALE_PAGE_ROLES } from '../wholesale-access';
import { model } from 'app/shared/sidebar/AppMenu';

jest.mock('./shipping.api', () => ({
  fetchShippingSettings: jest.fn(),
  saveShippingSettings: jest.fn(),
  testShippingProvider: jest.fn(),
  fetchClickShipPaymentMethods: jest.fn(),
}));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const saved: IShippingSettings = {
  easyPostEnabled: true,
  easyPostApiKeyConfigured: true,
  clickShipEnabled: false,
  clickShipApiKeyConfigured: false,
  currency: 'CAD',
  markupPercent: 10,
  rateTable: [{ country: 'CA', region: 'ON', baseFee: 8, perKg: 0.5 }],
  autoBuyLabel: true,
};

describe('Shipping settings rules', () => {
  it('turns the saved settings into a payload without keys', () => {
    const payload = toShippingPayload(toDraft(saved));
    expect(payload).toMatchObject({
      easyPostEnabled: true,
      easyPostApiKey: null,
      clearEasyPostApiKey: false,
      markupPercent: 10,
      weightPerUnitKg: null,
      rateTable: [{ country: 'CA', region: 'ON', baseFee: 8, perKg: 0.5 }],
    });
  });

  it('needs keys, a ClickShip payment method and sensible numbers', () => {
    const draft = toDraft({ ...saved, easyPostApiKeyConfigured: false });
    draft.clickShipEnabled = true;
    draft.clickShipApiKey = 'key';
    draft.numbers.maxParcelWeightKg = '90';
    draft.numbers.markupPercent = '0';
    const row = { ...newRateRow(), region: 'on', baseFee: '-1' };
    draft.rateTable = [...draft.rateTable, row];

    const errors = validateShipping(draft, { ...saved, easyPostApiKeyConfigured: false });

    expect(errors.easyPostApiKey).toBe('Enter the EasyPost API key');
    expect(errors.clickShipApiKey).toBeUndefined();
    expect(errors.clickShipPaymentMethodId).toBe('Choose the payment method');
    expect(errors.maxParcelWeightKg).toContain('70');
    expect(errors.markupPercent).toBeUndefined();
    expect(errors[`rate-${row.key}`]).toBeTruthy();
  });

  it('describes where a quote came from', () => {
    expect(quoteSource({ source: 'CLICKSHIP', carrier: 'Purolator', service: 'Ground' })).toBe('ClickShip / Purolator Ground');
    expect(quoteSource({ source: 'RATE_TABLE' })).toBe('Rate table');
    expect(quoteSource(null)).toBeNull();
  });

  it('is a Wholesale settings page for admins', () => {
    expect(WHOLESALE_PAGE_ROLES.shippingSettings).toEqual(['ROLE_ADMINISTRATOR', 'ROLE_WHOLESALE_ADMIN']);
    const wholesale = model.find(m => m.label === 'Wholesale');
    expect(wholesale?.items?.some(i => i.to === '/logistics/shipping-settings')).toBe(true);
  });
});

describe('Shipping settings page', () => {
  const scrollIntoView = jest.fn();
  beforeAll(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  beforeEach(() => {
    jest.mocked(fetchShippingSettings).mockReset().mockResolvedValue(saved);
    jest
      .mocked(saveShippingSettings)
      .mockReset()
      .mockImplementation(payload => Promise.resolve({ ...saved, ...(payload as IShippingSettings), easyPostApiKeyConfigured: true }));
    jest.mocked(testShippingProvider).mockReset().mockResolvedValue({ ok: true, message: 'Connected to EasyPost' });
    jest.mocked(fetchClickShipPaymentMethods).mockReset().mockResolvedValue([{ id: 'pm1', label: 'Net 30' }]);
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/logistics/shipping-settings#easypost']}>
        <ShippingSettings />
      </MemoryRouter>,
    );

  it('never shows a saved key and tests a newly typed one', async () => {
    renderPage();
    const key = await screen.findByLabelText<HTMLInputElement>('EasyPost API key');
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(key.value).toBe('');
    expect(key.type).toBe('password');
    expect(key.placeholder).toContain('Saved');

    fireEvent.change(key, { target: { value: ' EZTK123 ' } });
    fireEvent.click(screen.getAllByText('Test connection')[0]);

    await waitFor(() => expect(testShippingProvider).toHaveBeenCalledWith('EASYPOST', { apiKey: 'EZTK123', sandbox: undefined }));
    expect(await screen.findByText('Connected to EasyPost')).toBeTruthy();
  });

  it('saves the typed key once and clears the field', async () => {
    renderPage();
    const key = await screen.findByLabelText<HTMLInputElement>('EasyPost API key');
    fireEvent.change(key, { target: { value: 'EZAK999' } });
    fireEvent.click(screen.getByText('Save settings'));

    await waitFor(() => expect(saveShippingSettings).toHaveBeenCalledWith(expect.objectContaining({ easyPostApiKey: 'EZAK999' })));
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>('EasyPost API key').value).toBe(''));
  });

  it('loads the ClickShip payment methods for the typed key and sandbox', async () => {
    renderPage();
    await screen.findByLabelText('ClickShip API key');
    fireEvent.change(screen.getByLabelText('ClickShip API key'), { target: { value: 'cs-key' } });
    fireEvent.click(screen.getByLabelText('Test environment'));
    fireEvent.click(screen.getByText('Load payment methods'));

    await waitFor(() => expect(fetchClickShipPaymentMethods).toHaveBeenCalledWith({ apiKey: 'cs-key', sandbox: true }));
  });

  it('adds and removes rate table rows', async () => {
    renderPage();
    await screen.findByLabelText('Rate 1 province');
    fireEvent.click(screen.getByText('Add rate'));
    expect(screen.getByLabelText('Rate 2 flat fee')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Remove rate 1'));
    expect(screen.queryByLabelText('Rate 2 flat fee')).toBeNull();
    expect(screen.getByText('You have unsaved changes.')).toBeTruthy();
  });
});
