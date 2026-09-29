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
      'dashboard',
      'createOrder',
      'orderEntry',
      'orders',
      'callList',
      'customerNotes',
      'wholesaleOrders',
      'savedOrders',
      'routes',
      'map',
      'orderSheets',
      'production',
      'loadingLists',
      'factoryOrders',
      'deliveryRuns',
      'shipments',
      'liveRoute',
      'staleReturns',
      'creditMemos',
      'customers',
      'salesmen',
      'routeDefinitions',
      'factories',
      'closures',
      'users',
      'help',
    ]);
  });

  it('keeps salesmen on the ordering pages and their order sheets', () => {
    expect(pagesFor(AUTHORITIES.WHOLESALE_SALESMAN)).toEqual([
      'createOrder',
      'orderEntry',
      'orders',
      'callList',
      'customerNotes',
      'wholesaleOrders',
      'savedOrders',
      'routes',
      'map',
      'orderSheets',
      'help',
    ]);
  });

  it('lets bookkeepers read setup except factories and settings, and open factory orders for invoices', () => {
    const pages = pagesFor(AUTHORITIES.WHOLESALE_BOOKKEEPER);
    expect(pages).toEqual(
      expect.arrayContaining(['customers', 'routeDefinitions', 'closures', 'users', 'factoryOrders', 'deliveryRuns', 'cashHandover', 'staleReturns', 'creditMemos']),
    );
    expect(pages).toEqual(expect.arrayContaining(['dashboard', 'liveRoute', 'reconciliation', 'alerts', 'customerAccounts', 'invoices']));
    expect(pages).not.toContain('factories');
    expect(pages).not.toContain('settings');
    expect(pages).not.toContain('factoryFulfillment');
  });

  it('gives administrators and wholesale admins every page', () => {
    const all = Object.keys(WHOLESALE_PAGE_ROLES);
    expect(pagesFor(AUTHORITIES.ADMIN)).toEqual(all);
    expect(pagesFor(AUTHORITIES.WHOLESALE_ADMIN)).toEqual(all);
  });

  it('gives factory users their fulfillment, production and loading pages, and unrelated roles nothing', () => {
    expect(pagesFor(AUTHORITIES.WHOLESALE_FACTORY)).toEqual(['production', 'loadingLists', 'factoryFulfillment', 'shipments', 'factories', 'help']);
    expect(menuFor(AUTHORITIES.WHOLESALE_FACTORY)).toEqual(['Factories', 'Factory Fulfillment', 'Production', 'Loading Lists', 'Shipments', 'Help']);
    expect(WHOLESALE_ANY_ROLES).toContain(AUTHORITIES.WHOLESALE_FACTORY);
    expect(pagesFor(AUTHORITIES.ONLINE_ORDERING_USER)).toEqual([]);
  });

  it('lists Salesmen under Wholesale configuration for admins and sales managers, not under Users', () => {
    const salesmen = model.find(item => item.label === 'Wholesale').items.find(item => item.label === 'Salesmen');
    expect(salesmen).toEqual(expect.objectContaining({ to: '/logistics/salesmen', section: 'Configuration' }));
    expect(menuFor(AUTHORITIES.WHOLESALE_ADMIN)).toContain('Salesmen');
    expect(menuFor(AUTHORITIES.WHOLESALE_BOOKKEEPER)).not.toContain('Salesmen');
    expect(menuFor(AUTHORITIES.WHOLESALE_SALESMAN)).not.toContain('Salesmen');
    expect(model.find(item => item.label === 'Users').items.map(item => item.label)).not.toContain('Salesmen');
  });

  it('shows each role only its menu items', () => {
    expect(menuFor(AUTHORITIES.WHOLESALE_SALESMAN)).toEqual([
      'Call List',
      'Order Entry',
      'Orders',
      'Customer Notes',
      'Order Sheets',
      'Create Order',
      'Saved Orders',
      'Processed Orders',
      'Routes',
      'Map',
      'Help',
    ]);
    expect(menuFor(AUTHORITIES.WHOLESALE_SALES_MANAGER)).toEqual([
      'Dashboard',
      'Factories',
      'Route Setup',
      'Customers',
      'Salesmen',
      'Closures',
      'Call List',
      'Order Entry',
      'Orders',
      'Customer Notes',
      'Order Sheets',
      'Factory Orders',
      'Production',
      'Loading Lists',
      'Delivery Runs',
      'Shipments',
      'Live Route',
      'Stale Returns',
      'Credit Memos',
      'Wholesale Users',
      'Create Order',
      'Saved Orders',
      'Processed Orders',
      'Routes',
      'Map',
      'Help',
    ]);
    expect(menuFor(AUTHORITIES.WHOLESALE_ADMIN)).toContain('Wholesale Settings');
    expect(menuFor(AUTHORITIES.WHOLESALE_BOOKKEEPER)).toEqual(
      expect.arrayContaining(['Dashboard', 'Orders', 'Live Route', 'Reconciliation', 'Alerts', 'Customer Accounts', 'Invoices']),
    );
  });

  it('puts the Dashboard first and Help last, with the six sections in one block each between them', () => {
    const wholesale = model.find(item => item.label === 'Wholesale');
    expect(wholesale.items[0].label).toBe('Dashboard');
    expect(wholesale.items[0].section).toBeUndefined();
    expect(wholesale.items[wholesale.items.length - 1].label).toBe('Help');
    expect(wholesale.items[wholesale.items.length - 1].section).toBeUndefined();
    const sections = wholesale.items.slice(1, -1).map(item => item.section);
    expect(sections.every(Boolean)).toBe(true);
    expect(sections.filter((section, i) => section !== sections[i - 1])).toEqual([
      'Configuration',
      'Order Preparation',
      'Production',
      'Audits and Reconciliation',
      'Settings',
      'Other',
    ]);
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
