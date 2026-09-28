import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import WholesaleSalesmen from './salesmen';
import {
  assignCategory,
  assignCustomer,
  fetchAssignableCategories,
  fetchAssignedCustomers,
  fetchBranches,
  fetchCategoryAssignments,
  fetchSalesmen,
  saveSalesman,
  unassignCategory,
  unassignCustomer,
} from './salesman.api';
import { fetchWholesaleCustomers } from '../customers/wholesale-customer.api';
import { ISalesman, toSalesmanPayload, validateSalesman } from './salesman.model';

jest.mock('./salesman.api', () => ({
  fetchSalesmen: jest.fn(),
  saveSalesman: jest.fn(),
  fetchBranches: jest.fn(),
  fetchAssignedCustomers: jest.fn(),
  assignCustomer: jest.fn(),
  unassignCustomer: jest.fn(),
  fetchAssignableCategories: jest.fn(),
  fetchCategoryAssignments: jest.fn(),
  assignCategory: jest.fn(),
  unassignCategory: jest.fn(),
}));
jest.mock('../customers/wholesale-customer.api', () => ({ fetchWholesaleCustomers: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const sam: ISalesman = { id: 's-1', firstName: 'Sam', lastName: 'Diaz', email: 'sam@bakery.ca', username: 'sam', enabled: true, branches: [{ id: 'b-1' }] };
const rita: ISalesman = { id: 's-2', firstName: 'Rita', lastName: 'Moss', email: 'rita@bakery.ca', username: 'rita', enabled: true, branches: [] };

const renderPage = (authorities: string[] = [AUTHORITIES.WHOLESALE_ADMIN]) => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <WholesaleSalesmen />
    </Provider>,
  );
};

describe('salesman model', () => {
  it('needs a password on create, and on update only when a new one is typed', () => {
    const draft = { firstName: 'A', lastName: 'B', email: 'a@b.ca', password: '' };
    expect(validateSalesman(draft)).toEqual({ password: 'Use at least 8 characters' });
    expect(validateSalesman({ ...draft, id: 's-1' })).toEqual({});
    expect(validateSalesman({ ...draft, id: 's-1', password: 'short' })).toEqual({ password: 'Use at least 8 characters' });
    expect(validateSalesman({ ...draft, email: 'nope', password: 'long enough' }).email).toBeDefined();
  });

  it('always sends the branches, and the password only when set', () => {
    const draft = { firstName: ' A ', lastName: 'B', email: 'a@b.ca', username: ' ', password: 'secret123', temporaryPassword: true, branches: [{ id: 'b-1', name: 'Main' }] };
    expect(toSalesmanPayload(draft)).toEqual({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.ca',
      branches: [{ id: 'b-1' }],
      username: null,
      password: 'secret123',
      temporaryPassword: true,
    });
    expect(toSalesmanPayload({ ...draft, id: 's-1', password: '' })).toEqual({ firstName: 'A', lastName: 'B', email: 'a@b.ca', branches: [{ id: 'b-1' }] });
  });
});

describe('Salesmen page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchSalesmen).mockResolvedValue({ items: [sam, rita], total: 2 });
    jest.mocked(fetchBranches).mockResolvedValue([
      { id: 'b-1', name: 'Main' },
      { id: 'b-2', name: 'Plant' },
    ]);
    jest.mocked(fetchAssignableCategories).mockResolvedValue([
      { id: 'c-bread', name: 'Bread' },
      { id: 'c-cake', name: 'Cakes' },
    ]);
    jest.mocked(fetchAssignedCustomers).mockImplementation(id =>
      Promise.resolve(id === 's-1' ? [{ assignmentId: 'a-1', customerId: 'cu-1', name: 'Corner Cafe', accountNumber: 'W-100' }] : []),
    );
    jest.mocked(fetchCategoryAssignments).mockImplementation(id =>
      Promise.resolve(id === 's-1' ? [{ id: 'ca-1', salesmanId: 's-1', categoryId: 'c-bread', categoryName: 'Bread' }] : []),
    );
  });

  it('shows the first salesman with their customers, categories and branches', async () => {
    renderPage();
    expect(await screen.findByText('Corner Cafe')).toBeTruthy();
    expect(screen.getByText('Branches: Main')).toBeTruthy();
    const categories = screen.getByRole('group', { name: 'Categories' });
    await waitFor(() => expect(within(categories).getByRole('checkbox', { name: 'Bread' }).getAttribute('aria-checked')).toBe('true'));
    expect(within(categories).getByRole('checkbox', { name: 'Cakes' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText('1 of 2 assigned')).toBeTruthy();
  });

  it('warns when a salesman has no customers or categories', async () => {
    renderPage();
    fireEvent.click(await screen.findByText('Rita Moss'));
    expect(await screen.findByText(/No customers assigned yet/)).toBeTruthy();
    expect(await screen.findByText(/can't order any products/)).toBeTruthy();
    expect(fetchCategoryAssignments).toHaveBeenCalledWith('s-2');
  });

  it('assigns and removes product categories', async () => {
    jest.mocked(assignCategory).mockResolvedValue({ id: 'ca-2', salesmanId: 's-1', categoryId: 'c-cake' });
    renderPage();
    const categories = await screen.findByRole('group', { name: 'Categories' });
    await screen.findByText('1 of 2 assigned');

    fireEvent.click(within(categories).getByRole('checkbox', { name: 'Cakes' }));
    await waitFor(() => expect(assignCategory).toHaveBeenCalledWith('s-1', 'c-cake'));
    expect(await screen.findByText('2 of 2 assigned')).toBeTruthy();

    fireEvent.click(within(categories).getByRole('checkbox', { name: 'Bread' }));
    await waitFor(() => expect(unassignCategory).toHaveBeenCalledWith('ca-1'));
    expect(await screen.findByText('1 of 2 assigned')).toBeTruthy();
  });

  it('finds and assigns a customer, and removes one', async () => {
    jest.mocked(fetchWholesaleCustomers).mockResolvedValue({ items: [{ id: 'cu-2', businessName: 'Harbour Deli', accountNumber: 'W-200' }], total: 1 });
    jest.mocked(assignCustomer).mockResolvedValue({ id: 'a-2', salesmanId: 's-1', customerId: 'cu-2' });
    renderPage();
    await screen.findByText('Corner Cafe');

    fireEvent.change(screen.getByLabelText('Find a customer to assign'), { target: { value: 'harb' } });
    fireEvent.click(await screen.findByLabelText('Assign Harbour Deli'));
    await waitFor(() => expect(assignCustomer).toHaveBeenCalledWith('s-1', 'cu-2'));
    expect(fetchWholesaleCustomers).toHaveBeenCalledWith({ search: 'harb', page: 0, size: 8 });
    const assigned = screen.getByRole('list', { name: 'Assigned customers' });
    expect(await within(assigned).findByText('Harbour Deli')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Remove Corner Cafe'));
    await waitFor(() => expect(unassignCustomer).toHaveBeenCalledWith('a-1'));
    await waitFor(() => expect(within(assigned).queryByText('Corner Cafe')).toBeNull());
  });

  it('creates a salesman with a branch and selects them', async () => {
    const created = { id: 's-3', firstName: 'Lena', lastName: 'Ortiz', email: 'lena@bakery.ca', username: 'lena' };
    jest.mocked(saveSalesman).mockResolvedValue(created);
    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Corner Cafe');

    fireEvent.click(screen.getByText('New salesman'));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Lena' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Ortiz' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'lena@bakery.ca' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Welcome2026' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Plant' }));
    jest.mocked(fetchSalesmen).mockResolvedValue({ items: [created, sam, rita], total: 3 });
    fireEvent.click(screen.getByText('Create salesman'));

    await waitFor(() =>
      expect(saveSalesman).toHaveBeenCalledWith(undefined, {
        firstName: 'Lena',
        lastName: 'Ortiz',
        email: 'lena@bakery.ca',
        branches: [{ id: 'b-2' }],
        username: null,
        password: 'Welcome2026',
        temporaryPassword: true,
      }),
    );
    await waitFor(() => expect(fetchAssignedCustomers).toHaveBeenCalledWith('s-3'));
  });

  it('edits details without changing the password and keeps the branches', async () => {
    jest.mocked(saveSalesman).mockResolvedValue(sam);
    renderPage();
    await screen.findByText('Corner Cafe');
    fireEvent.click(screen.getByText('Edit details'));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Diaz-Ruiz' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(saveSalesman).toHaveBeenCalledWith('s-1', { firstName: 'Sam', lastName: 'Diaz-Ruiz', email: 'sam@bakery.ca', branches: [{ id: 'b-1' }] }),
    );
  });
});
