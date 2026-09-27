import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import { AUTHORITIES } from 'app/config/constants';
import PrivateRoute, { hasAnyAuthority } from 'app/shared/auth/private-route';
import { model } from 'app/shared/sidebar/AppMenu';

import { WHOLESALE_ANY_ROLES, WHOLESALE_PAGE_ROLES, WholesalePageKey } from './wholesale-access';

const pagesFor = (role: string) =>
  (Object.keys(WHOLESALE_PAGE_ROLES) as WholesalePageKey[]).filter(page => hasAnyAuthority([role], WHOLESALE_PAGE_ROLES[page]));

const menuFor = (role: string) =>
  model
    .find(item => item.label === 'Wholesale')
    .items.filter(item => hasAnyAuthority([role], item.role))
    .map(item => item.label);

const renderAt = (path: string, authorities: string[], page: WholesalePageKey) => {
  const store = configureStore({
    reducer: {
      authentication: () => ({ isAuthenticated: true, sessionHasBeenFetched: true, account: { authorities } }),
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path={path}
            element={
              <PrivateRoute hasAnyAuthorities={WHOLESALE_PAGE_ROLES[page]}>
                <div>page content</div>
              </PrivateRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('Wholesale access', () => {
  it('gives sales managers the ordering and setup pages, but not settings', () => {
    expect(pagesFor(AUTHORITIES.WHOLESALE_SALES_MANAGER)).toEqual([
      'createOrder',
      'orderEntry',
      'callList',
      'customerNotes',
      'wholesaleOrders',
      'savedOrders',
      'routes',
      'map',
      'customers',
      'routeDefinitions',
      'factories',
      'closures',
      'users',
    ]);
  });

  it('keeps salesmen on the ordering pages', () => {
    expect(pagesFor(AUTHORITIES.WHOLESALE_SALESMAN)).toEqual(['createOrder', 'orderEntry', 'callList', 'customerNotes', 'wholesaleOrders', 'savedOrders', 'routes', 'map']);
  });

  it('lets bookkeepers read setup except factories and settings', () => {
    const pages = pagesFor(AUTHORITIES.WHOLESALE_BOOKKEEPER);
    expect(pages).toEqual(expect.arrayContaining(['customers', 'routeDefinitions', 'closures', 'users']));
    expect(pages).not.toContain('factories');
    expect(pages).not.toContain('settings');
  });

  it('gives administrators and wholesale admins every page', () => {
    const all = Object.keys(WHOLESALE_PAGE_ROLES);
    expect(pagesFor(AUTHORITIES.ADMIN)).toEqual(all);
    expect(pagesFor(AUTHORITIES.WHOLESALE_ADMIN)).toEqual(all);
  });

  it('gives factory users only the Factories page, and unrelated roles nothing', () => {
    expect(pagesFor(AUTHORITIES.WHOLESALE_FACTORY)).toEqual(['factories']);
    expect(menuFor(AUTHORITIES.WHOLESALE_FACTORY)).toEqual(['Factories']);
    expect(WHOLESALE_ANY_ROLES).toContain(AUTHORITIES.WHOLESALE_FACTORY);
    expect(pagesFor(AUTHORITIES.ONLINE_ORDERING_USER)).toEqual([]);
  });

  it('shows each role only its menu items', () => {
    expect(menuFor(AUTHORITIES.WHOLESALE_SALESMAN)).toEqual(['Create Order', 'Order Entry', 'Call List', 'Customer Notes', 'Processed Orders', 'Saved Orders', 'Routes', 'Map']);
    expect(menuFor(AUTHORITIES.WHOLESALE_SALES_MANAGER)).toEqual([
      'Create Order',
      'Order Entry',
      'Call List',
      'Customer Notes',
      'Processed Orders',
      'Saved Orders',
      'Routes',
      'Map',
      'Wholesale Customers',
      'Route Setup',
      'Factories',
      'Closures',
      'Wholesale Users',
    ]);
    expect(menuFor(AUTHORITIES.WHOLESALE_ADMIN)).toContain('Wholesale Settings');
  });

  it('blocks a direct URL without the role', () => {
    renderAt('/logistics/factories', [AUTHORITIES.WHOLESALE_SALESMAN], 'factories');
    expect(screen.queryByText('page content')).toBeNull();
    expect(document.querySelector('.insufficient-authority')).not.toBeNull();
  });

  it('opens a direct URL with the role', () => {
    renderAt('/logistics/factories', [AUTHORITIES.WHOLESALE_SALES_MANAGER], 'factories');
    expect(screen.getByText('page content')).toBeTruthy();
    expect(document.querySelector('.insufficient-authority')).toBeNull();
  });
});
