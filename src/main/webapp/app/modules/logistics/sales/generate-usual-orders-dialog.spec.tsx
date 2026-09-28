import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { GenerateUsualOrdersDialog } from './generate-usual-orders-dialog';
import { fetchUsualOrderPreview, generateUsualOrders } from './sales.api';

jest.mock('./sales.api', () => ({
  fetchUsualOrderPreview: jest.fn(),
  generateUsualOrders: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const register = { id: 'reg-1', name: 'Online', branchId: 'b-1', branchName: 'Main', tillId: 't-1' };

describe('Generate usual orders dialog', () => {
  beforeEach(() => {
    jest.mocked(fetchUsualOrderPreview).mockReset().mockResolvedValue([
      { customerId: 'c-1', name: 'Corner Cafe', stopSequence: 1, lines: [{ itemId: 'bread', name: 'White Bread', quantity: 10 }] },
      { customerId: 'c-2', name: 'Deli Two', stopSequence: 2, lines: [{ itemId: 'rolls', name: 'Rolls', quantity: 4 }] },
      { customerId: 'c-3', name: 'Shop Three', lines: [], skipReason: 'Already has an order for this date' },
    ]);
    jest.mocked(generateUsualOrders).mockReset().mockResolvedValue({
      created: [{ customerId: 'c-1', name: 'Corner Cafe', orderId: 'o-1' }],
      skipped: [],
    });
  });

  const renderDialog = (onGenerated = jest.fn()) =>
    render(
      <GenerateUsualOrdersDialog
        open
        date="2026-10-06"
        routeId="r-1"
        routeLabel="North"
        register={register}
        onClose={jest.fn()}
        onGenerated={onGenerated}
      />,
    );

  it('previews the usual orders, lets customers be left out and generates the rest', async () => {
    const onGenerated = jest.fn();
    renderDialog(onGenerated);

    expect(await screen.findByText('10 x White Bread')).toBeTruthy();
    expect(fetchUsualOrderPreview).toHaveBeenCalledWith('2026-10-06', 'r-1');
    expect(screen.getByText('Already has an order for this date')).toBeTruthy();
    expect(screen.getByText('Generate 2 orders')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Generate for Deli Two'));
    fireEvent.click(screen.getByText('Generate 1 order'));

    await waitFor(() => expect(generateUsualOrders).toHaveBeenCalledTimes(1));
    expect(generateUsualOrders).toHaveBeenCalledWith({ date: '2026-10-06', routeId: 'r-1', branchId: 'b-1', tillId: 't-1', customerIds: ['c-1'] });
    expect(await screen.findByText('1 order generated.')).toBeTruthy();
    expect(onGenerated).toHaveBeenCalled();
  });

  it('needs a register', async () => {
    render(<GenerateUsualOrdersDialog open date="2026-10-06" routeLabel="all routes" onClose={jest.fn()} onGenerated={jest.fn()} />);
    await screen.findByText('Corner Cafe');
    expect(screen.getByText('Choose a register first.')).toBeTruthy();
    expect(screen.getByText('Generate 2 orders').closest('button').disabled).toBe(true);
  });
});
