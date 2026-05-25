import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaymentMethodSetting from './payment-method-setting';
import { getAllEntities, updateEntity } from './payment-method-setting.reducer';

const mockDispatch = jest.fn();
let mockState;

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('./payment-method-setting.reducer', () => ({
  getAllEntities: jest.fn(() => ({ type: 'paymentMethodSetting/getAllEntities' })),
  updateEntity: jest.fn(payload => ({ type: 'paymentMethodSetting/updateEntity', payload })),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, disabled, onCheckedChange, 'aria-label': ariaLabel }) => (
    <input
      type="checkbox"
      aria-label={ariaLabel}
      checked={!!checked}
      disabled={disabled}
      onChange={event => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

jest.mock('app/shared/components/draggable-list/draggable-list', () => ({
  DraggableList: ({ value, itemTemplate, onChange }) => (
    <div>
      <button type="button" onClick={() => onChange({ value: [...value].reverse() })}>
        Reorder
      </button>
      {value.map((item, index) => (
        <div key={item.id}>{itemTemplate(item, index)}</div>
      ))}
    </div>
  ),
}));

describe('PaymentMethodSetting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      paymentMethodSetting: {
        entities: [
          { id: 'cash-id', transactionMethod: 'cash', name: 'Cash', show: true, order: 1 },
          { id: 'visa-id', transactionMethod: 'visa', name: 'Visa', show: true, order: 0 },
          { id: 'custom-id', transactionMethod: 'custom', name: 'Custom', show: false, order: null },
        ],
        loading: false,
      },
    };

    mockDispatch.mockImplementation(action => {
      if (action?.type === 'paymentMethodSetting/updateEntity') {
        return {
          unwrap: () => Promise.resolve({ data: action.payload.entity }),
        };
      }
      return action;
    });
  });

  it('renders payment methods sorted by order with null orders last', () => {
    render(
      <MemoryRouter>
        <PaymentMethodSetting />
      </MemoryRouter>
    );

    const nameLinks = screen.getAllByRole('link').filter(link => ['Visa', 'Cash', 'Custom'].includes(link.textContent || ''));
    expect(nameLinks.map(link => link.textContent)).toEqual(['Visa', 'Cash', 'Custom']);
    expect(screen.getByText('Transaction Method')).not.toBeNull();
    expect(screen.getByText('Show')).not.toBeNull();
  });

  it('auto-saves updated order values after reorder', async () => {
    render(
      <MemoryRouter>
        <PaymentMethodSetting />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /reorder/i }));

    await waitFor(() => {
      expect(updateEntity).toHaveBeenCalledTimes(3);
    });

    expect(updateEntity).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ id: 'custom-id', order: 0 }), refreshList: false }));
    expect(updateEntity).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ id: 'cash-id', order: 1 }), refreshList: false }));
    expect(updateEntity).toHaveBeenCalledWith(expect.objectContaining({ entity: expect.objectContaining({ id: 'visa-id', order: 2 }), refreshList: false }));
    expect(getAllEntities).toHaveBeenCalledTimes(2);
  });

  it('renders inline show checkboxes and toggles visibility immediately', async () => {
    render(
      <MemoryRouter>
        <PaymentMethodSetting />
      </MemoryRouter>
    );

    const cashToggle = screen.getByLabelText('Toggle visibility for Cash') as HTMLInputElement;
    const customToggle = screen.getByLabelText('Toggle visibility for Custom') as HTMLInputElement;

    expect(cashToggle.checked).toBe(true);
    expect(customToggle.checked).toBe(false);

    fireEvent.click(cashToggle);

    await waitFor(() => {
      expect(updateEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: expect.objectContaining({
            id: 'cash-id',
            show: false,
          }),
          refreshList: false,
        })
      );
    });
  });
});
