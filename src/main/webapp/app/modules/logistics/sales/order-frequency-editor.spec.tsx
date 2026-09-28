import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { OrderFrequencyEditor } from './order-frequency-editor';
import { fetchCatalog, fetchOrderFrequencies, saveOrderFrequencies } from './sales.api';
import { IOrderFrequency, isDueOn, nextDueDates, toFrequencyPayload, validateFrequency } from './sales.model';

jest.mock('./sales.api', () => ({
  fetchOrderFrequencies: jest.fn(),
  saveOrderFrequencies: jest.fn(),
  fetchCatalog: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const bread: IOrderFrequency = { id: 'f-1', itemId: 'bread', quantity: 12, frequencyType: 'WEEKDAYS', weekdays: ['MONDAY', 'THURSDAY'], active: true };

describe('order frequency model', () => {
  it('follows the server rules for each frequency', () => {
    expect(isDueOn({ ...bread }, '2026-10-05')).toBe(true);
    expect(isDueOn({ ...bread }, '2026-10-06')).toBe(false);
    expect(isDueOn({ ...bread, frequencyType: 'DAILY' }, '2026-10-06')).toBe(true);
    const everyThird: IOrderFrequency = { itemId: 'x', quantity: 1, frequencyType: 'EVERY_N_DAYS', intervalDays: 3, anchorDate: '2026-10-01' };
    expect(nextDueDates(everyThird, '2026-09-28')).toEqual(['2026-10-01', '2026-10-04', '2026-10-07']);
    expect(isDueOn({ ...bread, endDate: '2026-10-04' }, '2026-10-05')).toBe(false);
    expect(isDueOn({ ...bread, active: false }, '2026-10-05')).toBe(false);
  });

  it('validates like the server and cleans the payload', () => {
    expect(validateFrequency({ ...bread, quantity: 0 })).toBe('The quantity must be more than zero');
    expect(validateFrequency({ ...bread, weekdays: [] })).toBe('Choose at least one weekday');
    expect(validateFrequency({ itemId: 'x', quantity: 1, frequencyType: 'EVERY_N_DAYS', intervalDays: 3 })).toBe('Choose the first date');
    expect(validateFrequency({ ...bread, startDate: '2026-10-10', endDate: '2026-10-01' })).toBe('The end date is before the start date');
    expect(validateFrequency(bread)).toBeUndefined();
    expect(toFrequencyPayload([{ ...bread, notes: '  ', intervalDays: 4, startDate: '' }])[0]).toEqual({
      id: 'f-1',
      itemId: 'bread',
      variantId: null,
      quantity: 12,
      frequencyType: 'WEEKDAYS',
      weekdays: ['MONDAY', 'THURSDAY'],
      intervalDays: null,
      anchorDate: null,
      startDate: null,
      endDate: null,
      active: true,
      notes: null,
    });
  });
});

describe('OrderFrequencyEditor', () => {
  beforeEach(() => {
    jest.mocked(fetchOrderFrequencies).mockResolvedValue([bread]);
    jest.mocked(fetchCatalog).mockResolvedValue([
      { itemId: 'bread', name: 'White Bread', categories: [], orderable: true, variants: [{ id: 'loaf', name: 'Loaf', price: 2 }] },
    ]);
    jest.mocked(saveOrderFrequencies).mockReset().mockResolvedValue([]);
  });

  it('loads the lines and saves them back', async () => {
    const onClose = jest.fn();
    render(<OrderFrequencyEditor customer={{ id: 'c-1', businessName: 'Corner Cafe' }} readOnly={false} onClose={onClose} />);

    expect(await screen.findByText('Usual order: Corner Cafe')).toBeTruthy();
    expect(await screen.findByDisplayValue('12')).toBeTruthy();
    expect(screen.getByText(/Next due:/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '15' } });
    fireEvent.click(screen.getByText('Save usual order'));

    await waitFor(() => expect(saveOrderFrequencies).toHaveBeenCalledTimes(1));
    expect(jest.mocked(saveOrderFrequencies).mock.calls[0][0]).toBe('c-1');
    expect(jest.mocked(saveOrderFrequencies).mock.calls[0][1][0]).toMatchObject({ id: 'f-1', quantity: 15, weekdays: ['MONDAY', 'THURSDAY'] });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('does not save a line without an item', async () => {
    render(<OrderFrequencyEditor customer={{ id: 'c-1' }} readOnly={false} onClose={jest.fn()} />);
    await screen.findByDisplayValue('12');
    fireEvent.click(screen.getByText('Add item'));
    fireEvent.click(screen.getByText('Save usual order'));

    expect(await screen.findByText('Choose an item')).toBeTruthy();
    expect(saveOrderFrequencies).not.toHaveBeenCalled();
  });

  it('is read only without edit rights', async () => {
    render(<OrderFrequencyEditor customer={{ id: 'c-1' }} readOnly onClose={jest.fn()} />);
    await screen.findByDisplayValue('12');
    expect(screen.queryByText('Save usual order')).toBeNull();
    expect(screen.queryByText('Add item')).toBeNull();
  });
});
