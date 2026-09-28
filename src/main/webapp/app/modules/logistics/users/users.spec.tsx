import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';

import WholesaleUsers from './users';
import { fetchUsers, saveUser } from './wholesale-user.api';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleUser, toUserPayload, validateUser } from './wholesale-user.model';

jest.mock('./wholesale-user.api', () => ({ fetchUsers: jest.fn(), saveUser: jest.fn(), deleteUser: jest.fn() }));
jest.mock('../factories/wholesale-factory.api', () => ({ fetchFactories: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const manager: IWholesaleUser = { id: 'u-1', firstName: 'Mona', lastName: 'Lee', email: 'mona@bakery.ca', username: 'mona', enabled: true };
const kioskUser: IWholesaleUser = { id: 'u-2', firstName: 'Omar', lastName: 'Aziz', email: 'omar@bakery.ca', username: 'omar', enabled: true, factoryIds: ['f-win'] };

const renderPage = (authorities: string[]) => {
  const store = configureStore({ reducer: { authentication: () => ({ account: { authorities } }) } });
  return render(
    <Provider store={store}>
      <WholesaleUsers />
    </Provider>,
  );
};

describe('wholesale user model', () => {
  it('needs a password only when creating, and a factory only for factory users', () => {
    const draft = { firstName: 'A', lastName: 'B', email: 'a@b.ca', password: 'short', factoryIds: [] };
    expect(validateUser(draft, 'salesManagers')).toEqual({ password: 'Use at least 8 characters' });
    expect(validateUser({ ...draft, id: 'u-1' }, 'salesManagers')).toEqual({});
    expect(validateUser({ ...draft, password: 'long enough' }, 'factoryUsers')).toEqual({ factoryIds: 'Assign at least one factory' });
    expect(validateUser({ ...draft, email: 'nope' }, 'salesManagers').email).toBeDefined();
  });

  it('sends the password only on create and drops factories for sales managers', () => {
    const draft = { firstName: ' A ', lastName: 'B', email: 'a@b.ca', username: ' ', password: 'secret123', temporaryPassword: true, factoryIds: ['f-1'] };
    expect(toUserPayload(draft, 'salesManagers')).toEqual({
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.ca',
      factoryIds: [],
      username: null,
      password: 'secret123',
      temporaryPassword: true,
    });
    expect(toUserPayload({ ...draft, id: 'u-1' }, 'factoryUsers')).toEqual({ firstName: 'A', lastName: 'B', email: 'a@b.ca', factoryIds: ['f-1'] });
  });
});

describe('Wholesale Users page', () => {
  beforeEach(() => {
    jest.mocked(fetchFactories).mockResolvedValue([
      { id: 'f-win', name: 'Windsor', active: true },
      { id: 'f-tor', name: 'Toronto', active: true },
    ]);
    jest.mocked(fetchUsers).mockImplementation(kind => Promise.resolve({ items: kind === 'factoryUsers' ? [kioskUser] : [manager], total: 1 }));
    jest.mocked(saveUser).mockReset();
  });

  it('lists sales managers, then factory users with their factories', async () => {
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    expect(await screen.findByText('Mona Lee')).toBeTruthy();
    expect(fetchUsers).toHaveBeenCalledWith('salesManagers', 0, 50);

    fireEvent.click(screen.getByRole('tab', { name: 'Factory users' }));
    expect(await screen.findByText('Omar Aziz')).toBeTruthy();
    expect(await screen.findByText('Windsor')).toBeTruthy();
    expect(fetchUsers).toHaveBeenCalledWith('factoryUsers', 0, 50);
    expect(screen.getByText('New factory user')).toBeTruthy();
  });

  it('invites a factory user assigned to a factory', async () => {
    jest.mocked(saveUser).mockResolvedValue({ ...kioskUser, id: 'u-3', firstName: 'Nadia', lastName: 'Park' });
    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Mona Lee');
    fireEvent.click(screen.getByRole('tab', { name: 'Factory users' }));
    await screen.findByText('Omar Aziz');

    fireEvent.click(screen.getByText('New factory user'));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Nadia' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Park' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nadia@bakery.ca' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Welcome2026' } });
    fireEvent.click(screen.getByText('Create factory user'));
    expect(await screen.findByText('Assign at least one factory')).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Toronto' }));
    fireEvent.click(screen.getByText('Create factory user'));
    await waitFor(() =>
      expect(saveUser).toHaveBeenCalledWith('factoryUsers', undefined, {
        firstName: 'Nadia',
        lastName: 'Park',
        email: 'nadia@bakery.ca',
        username: null,
        password: 'Welcome2026',
        temporaryPassword: true,
        factoryIds: ['f-tor'],
      }),
    );
  });

  it('edits a sales manager without touching the password', async () => {
    jest.mocked(saveUser).mockResolvedValue(manager);
    renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    fireEvent.click(await screen.findByText('Mona Lee'));
    await screen.findByRole('dialog');
    expect(screen.queryByLabelText('Password')).toBeNull();
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Li' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() =>
      expect(saveUser).toHaveBeenCalledWith('salesManagers', 'u-1', { firstName: 'Mona', lastName: 'Li', email: 'mona@bakery.ca', factoryIds: [] }),
    );
  });

  it('lets sales managers manage factory users but only view sales managers', async () => {
    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Mona Lee');
    expect(screen.queryByText('New sales manager')).toBeNull();
    expect(screen.queryByLabelText('Actions for Mona Lee')).toBeNull();
    expect(screen.getByText('Read only.')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Factory users' }));
    await screen.findByText('Omar Aziz');
    expect(screen.getByText('New factory user')).toBeTruthy();
    expect(screen.getByLabelText('Actions for Omar Aziz')).toBeTruthy();
  });

  it('creates a driver without factories, and only wholesale admins manage drivers', async () => {
    const driver: IWholesaleUser = { id: 'u-4', firstName: 'Dana', lastName: 'Cole', email: 'dana@bakery.ca', username: 'dana', enabled: true };
    jest.mocked(fetchUsers).mockImplementation(kind => Promise.resolve({ items: kind === 'drivers' ? [driver] : [manager], total: 1 }));
    jest.mocked(saveUser).mockResolvedValue({ ...driver, id: 'u-5', firstName: 'Sam' });
    const { unmount } = renderPage([AUTHORITIES.WHOLESALE_ADMIN]);
    await screen.findByText('Mona Lee');
    fireEvent.click(screen.getByRole('tab', { name: 'Drivers' }));
    expect(await screen.findByText('Dana Cole')).toBeTruthy();
    expect(fetchUsers).toHaveBeenCalledWith('drivers', 0, 50);

    fireEvent.click(screen.getByText('New driver'));
    await screen.findByRole('dialog');
    expect(screen.queryByRole('group', { name: 'Factories' })).toBeNull();
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Sam' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Cole' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sam@bakery.ca' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Welcome2026' } });
    fireEvent.click(screen.getByText('Create driver'));
    await waitFor(() =>
      expect(saveUser).toHaveBeenCalledWith('drivers', undefined, {
        firstName: 'Sam',
        lastName: 'Cole',
        email: 'sam@bakery.ca',
        username: null,
        password: 'Welcome2026',
        temporaryPassword: true,
        factoryIds: [],
      }),
    );
    unmount();

    renderPage([AUTHORITIES.WHOLESALE_SALES_MANAGER]);
    await screen.findByText('Mona Lee');
    fireEvent.click(screen.getByRole('tab', { name: 'Drivers' }));
    await screen.findByText('Dana Cole');
    expect(screen.queryByText('New driver')).toBeNull();
    expect(screen.getByText('Read only.')).toBeTruthy();
  });

  it('is read only for bookkeepers', async () => {
    renderPage([AUTHORITIES.WHOLESALE_BOOKKEEPER]);
    await screen.findByText('Mona Lee');
    expect(screen.queryByText('New sales manager')).toBeNull();
    expect(screen.queryByLabelText('Actions for Mona Lee')).toBeNull();
    fireEvent.click(screen.getByText('Mona Lee'));
    await screen.findByRole('dialog');
    expect(screen.queryByText('Save')).toBeNull();
  });
});
