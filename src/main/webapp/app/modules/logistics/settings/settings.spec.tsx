import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import WholesaleSettings from './settings';
import { fetchSettings, saveSettings } from './wholesale-settings.api';
import { IWholesaleSettings, sameSettings, toSettingsPayload, validateSettings } from './wholesale-settings.model';

jest.mock('./wholesale-settings.api', () => ({ fetchSettings: jest.fn(), saveSettings: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const defaults: IWholesaleSettings = {
  salesmanCanViewOldOrders: false,
  approvalEmailRecipients: ['ops@bakery.ca'],
  allowOverDelivery: false,
  requireReasonOnQuantityChange: true,
  reminderTimes: ['14:00'],
  escalateToManagerAtCutoff: true,
  autoDraftFromFrequencyAtCutoff: false,
  staleReturnRateAlertPercent: 20,
  staleCreditPercent: 100,
  staleCreditPriceSource: 'SOURCE_ORDER_PRICE',
  deliveryNoteFooter: null,
  invoiceTiming: 'ON_DELIVERY',
  defaultShortageAllocation: 'PROPORTIONAL',
};

describe('wholesale settings model', () => {
  it('keeps a saved alert percentage required, since the server cannot clear it', () => {
    expect(validateSettings({ ...defaults, staleReturnRateAlertPercent: null }, defaults).staleReturnRateAlertPercent).toBeDefined();
    expect(validateSettings({ ...defaults, staleReturnRateAlertPercent: null }, { ...defaults, staleReturnRateAlertPercent: null })).toEqual({});
    expect(validateSettings({ ...defaults, staleCreditPercent: 120 }, defaults).staleCreditPercent).toBe('Use a percentage from 0 to 100');
    expect(validateSettings({ ...defaults, deliveryNoteFooter: 'x'.repeat(2001) }, defaults).deliveryNoteFooter).toBeDefined();
  });

  it('sends an empty footer so it is cleared, and sorted reminder times', () => {
    expect(toSettingsPayload({ ...defaults, reminderTimes: ['16:00', '09:30'] })).toMatchObject({ deliveryNoteFooter: '', reminderTimes: ['09:30', '16:00'] });
    expect(sameSettings(defaults, { ...defaults, deliveryNoteFooter: '' })).toBe(true);
  });
});

describe('Wholesale Settings page', () => {
  beforeEach(() => {
    jest.mocked(fetchSettings).mockResolvedValue(defaults);
    jest.mocked(saveSettings).mockReset();
  });

  it('saves the changes and shows them again after a reload', async () => {
    jest.mocked(saveSettings).mockImplementation(settings => Promise.resolve(settings));
    const { unmount } = render(<WholesaleSettings />);
    expect(await screen.findByText('14:00')).toBeTruthy();
    expect(screen.queryByText('You have unsaved changes.')).toBeNull();

    fireEvent.click(screen.getByLabelText('Allow over-delivery'));
    fireEvent.change(screen.getByLabelText('Reminder times'), { target: { value: '09:30' } });
    fireEvent.click(screen.getByText('Add time'));
    fireEvent.change(screen.getByLabelText('Recipients'), { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByText('Add'));
    expect(screen.getByText('Enter a valid email')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Recipients'), { target: { value: ' Manager@Bakery.ca ' } });
    fireEvent.click(screen.getByText('Add'));
    fireEvent.click(screen.getByLabelText('Remove ops@bakery.ca'));
    fireEvent.click(within(screen.getByRole('radiogroup', { name: 'When a factory is short' })).getByRole('radio', { name: /By customer priority/ }));
    fireEvent.change(screen.getByLabelText('Footer'), { target: { value: 'Thank you!' } });

    expect(screen.getByText('You have unsaved changes.')).toBeTruthy();
    fireEvent.click(screen.getByText('Save settings'));

    const expected = {
      ...defaults,
      allowOverDelivery: true,
      reminderTimes: ['09:30', '14:00'],
      approvalEmailRecipients: ['manager@bakery.ca'],
      defaultShortageAllocation: 'PRIORITY',
      deliveryNoteFooter: 'Thank you!',
    };
    await waitFor(() => expect(saveSettings).toHaveBeenCalledWith(expected));
    await waitFor(() => expect(screen.queryByText('You have unsaved changes.')).toBeNull());

    unmount();
    jest.mocked(fetchSettings).mockResolvedValue(expected as IWholesaleSettings);
    render(<WholesaleSettings />);
    expect(await screen.findByText('09:30')).toBeTruthy();
    expect(screen.getByText('manager@bakery.ca')).toBeTruthy();
    expect(screen.getByRole('radio', { name: /By customer priority/ }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByLabelText<HTMLTextAreaElement>('Footer').value).toBe('Thank you!');
  });

  it('discards unsaved changes', async () => {
    render(<WholesaleSettings />);
    await screen.findByText('14:00');
    fireEvent.click(screen.getByLabelText('Remove 14:00'));
    expect(screen.queryByText('14:00')).toBeNull();
    fireEvent.click(screen.getByText('Discard'));
    expect(screen.getByText('14:00')).toBeTruthy();
    expect(screen.queryByText('You have unsaved changes.')).toBeNull();
  });

  it('does not save an emptied alert percentage', async () => {
    render(<WholesaleSettings />);
    await screen.findByText('14:00');
    fireEvent.change(screen.getByLabelText('Alert above return rate'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save settings'));
    expect(await screen.findByText('Enter a percentage from 0 to 100')).toBeTruthy();
    expect(saveSettings).not.toHaveBeenCalled();
  });
});
