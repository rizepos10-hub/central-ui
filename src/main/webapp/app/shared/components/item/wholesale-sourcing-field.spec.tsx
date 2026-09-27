import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { WholesaleSourcingField } from './wholesale-sourcing-field';

describe('WholesaleSourcingField', () => {
  it('reads an item without a value as Produced', () => {
    render(<WholesaleSourcingField value={undefined} onChange={jest.fn()} />);
    expect(screen.getByRole('radio', { name: 'Produced' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Purchased' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText('Made in our own factories.')).toBeTruthy();
  });

  it('shows a saved value and reports changes', () => {
    const onChange = jest.fn();
    const { rerender } = render(<WholesaleSourcingField value="PURCHASED" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: 'Purchased' }).getAttribute('aria-checked')).toBe('true');

    fireEvent.click(screen.getByRole('radio', { name: 'Produced' }));
    expect(onChange).toHaveBeenCalledWith('PRODUCED');

    rerender(<WholesaleSourcingField value="PRODUCED" onChange={onChange} hideLabel />);
    expect(screen.queryByText('Wholesale sourcing')).toBeNull();
    expect(screen.getByRole('radio', { name: 'Produced' }).getAttribute('aria-checked')).toBe('true');
  });
});
