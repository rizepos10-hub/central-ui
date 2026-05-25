import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PaymentMethodSettingUpdate from './payment-method-setting-update';
import { changeEntityField } from './payment-method-setting.reducer';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
let mockState;

jest.mock('app/config/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: selector => selector(mockState),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./payment-method-setting.reducer', () => ({
  getEntity: jest.fn(id => ({ type: 'paymentMethodSetting/getEntity', payload: id })),
  updateEntity: jest.fn(entity => ({ type: 'paymentMethodSetting/updateEntity', payload: entity })),
  createEntity: jest.fn(entity => ({ type: 'paymentMethodSetting/createEntity', payload: entity })),
  reset: jest.fn(() => ({ type: 'paymentMethodSetting/reset' })),
  changeEntityField: jest.fn(payload => ({ type: 'paymentMethodSetting/changeEntityField', payload })),
}));

jest.mock('react-select', () => props => (
  <select
    aria-label={props.placeholder || 'select'}
    value={props.value?.value ?? ''}
    disabled={props.isDisabled}
    onChange={event => {
      const option = props.options.find(opt => String(opt.value) === event.target.value);
      props.onChange(option);
    }}
  >
    {props.options.map(option => (
      <option key={String(option.value)} value={String(option.value)}>
        {option.label}
      </option>
    ))}
  </select>
));

describe('PaymentMethodSettingUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      paymentMethodSetting: {
        entity: {
          id: 'cash-id',
          transactionMethod: 'cash',
          name: 'Cash',
          show: true,
          order: 3,
        },
        loading: false,
        updating: false,
      },
    };
  });

  it('renders the order field and clears it as null', () => {
    render(
      <MemoryRouter initialEntries={['/payment-method-setting/cash-id/edit']}>
        <Routes>
          <Route path="/payment-method-setting/:id/edit" element={<PaymentMethodSettingUpdate />} />
        </Routes>
      </MemoryRouter>
    );

    const orderInput = screen.getByLabelText('Order') as HTMLInputElement;
    expect(orderInput.value).toBe('3');
    expect(screen.getByText(/name, visibility, and order can be edited/i)).not.toBeNull();

    fireEvent.change(orderInput, { target: { value: '' } });

    expect(changeEntityField).toHaveBeenCalledWith({ name: 'order', value: null });
  });
});
