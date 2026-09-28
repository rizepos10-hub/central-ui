import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import CustomerNotes from './customer-notes';
import { CustomerNotesDialog } from './customer-notes-dialog';
import { createCustomerNote, fetchCustomerNotes, fetchNotesForCustomer, resolveCustomerNote } from './sales.api';
import { ICustomerNote } from './sales.model';

jest.mock('./sales.api', () => ({
  createCustomerNote: jest.fn(),
  fetchCustomerNotes: jest.fn(),
  fetchNotesForCustomer: jest.fn(),
  resolveCustomerNote: jest.fn(),
}));

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const note = (id: string, text: string, patch: Partial<ICustomerNote> = {}): ICustomerNote => ({
  id,
  customerId: 'c-1',
  customerName: 'Corner Cafe',
  text,
  status: 'OPEN',
  sendToRoles: ['ROLE_WHOLESALE_SALES_MANAGER'],
  source: 'CALL_LIST',
  createdBy: 'sam',
  ...patch,
});

describe('Customer Notes page', () => {
  beforeEach(() => {
    jest.mocked(fetchCustomerNotes).mockReset().mockResolvedValue([note('n-1', 'Wants earlier drop', { urgent: true }), note('n-2', 'New manager')]);
    jest.mocked(resolveCustomerNote).mockReset().mockResolvedValue(note('n-1', 'Wants earlier drop', { status: 'RESOLVED' }));
  });

  it('lists open notes and drops one once resolved', async () => {
    render(<CustomerNotes />);
    expect(await screen.findByText('Wants earlier drop')).toBeTruthy();
    expect(fetchCustomerNotes).toHaveBeenCalledWith({ status: 'OPEN', urgent: undefined });
    expect(screen.getByText('Urgent')).toBeTruthy();
    expect(screen.getAllByText('Sent to Sales managers')).toHaveLength(2);
    expect(screen.getAllByText('Call list')).toHaveLength(2);

    fireEvent.click(screen.getAllByText('Resolve')[0]);
    await waitFor(() => expect(screen.queryByText('Wants earlier drop')).toBeNull());
    expect(resolveCustomerNote).toHaveBeenCalledWith('n-1');
    expect(screen.getByText('New manager')).toBeTruthy();
  });

  it('filters to urgent notes', async () => {
    render(<CustomerNotes />);
    await screen.findByText('New manager');
    fireEvent.click(screen.getByRole('checkbox'));
    await waitFor(() => expect(fetchCustomerNotes).toHaveBeenLastCalledWith({ status: 'OPEN', urgent: true }));
  });
});

describe('Customer notes dialog', () => {
  it('shows the customer notes and adds a new one on top', async () => {
    jest.mocked(fetchNotesForCustomer).mockResolvedValue([note('n-2', 'New manager', { status: 'RESOLVED', resolvedBy: 'ann' })]);
    jest.mocked(createCustomerNote).mockResolvedValue(note('n-3', 'Closed Monday', { source: 'OTHER' }));
    render(<CustomerNotesDialog customer={{ id: 'c-1', name: 'Corner Cafe' }} onClose={jest.fn()} />);

    expect(await screen.findByText('New manager')).toBeTruthy();
    expect(fetchNotesForCustomer).toHaveBeenCalledWith('c-1');
    expect(screen.getByText('Resolved')).toBeTruthy();

    fireEvent.click(screen.getByText('Add note'));
    fireEvent.change(await screen.findByLabelText('Note'), { target: { value: 'Closed Monday' } });
    fireEvent.click(screen.getByText('Save note'));

    expect(await screen.findByText('Closed Monday')).toBeTruthy();
    expect(createCustomerNote).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'c-1', text: 'Closed Monday', source: 'OTHER' }));
  });
});
