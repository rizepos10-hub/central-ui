import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import SkuEditor from './sku-editor';

describe('SkuEditor', () => {
  it('keeps existing SKUs when backspace is pressed in the empty entry field', () => {
    const onChange = jest.fn();

    render(<SkuEditor value={['SKU-1', 'SKU-2']} onChange={onChange} placeholder="Variant SKU" />);

    fireEvent.keyDown(screen.getByPlaceholderText('Variant SKU'), {
      key: 'Backspace',
      code: 'Backspace',
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('SKU-1')).toBeTruthy();
    expect(screen.getByText('SKU-2')).toBeTruthy();
  });
});
