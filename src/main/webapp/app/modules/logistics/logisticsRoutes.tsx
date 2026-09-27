import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PrivateRoute from 'app/shared/auth/private-route';
import WholesaleOrders from './wholesale-orders';
import WholesaleSavedOrders from './wholesale-saved-orders';
import RoutesPage from './routes';
import RouteOrders from './route-orders';
import LogisticsMap from './map';
import ChooseRegister from 'app/entities/order/choose-register';
import WholesaleThemePreview from './wholesale-ui/wholesale-theme-preview';
import WholesaleFactories from './factories/factories';
import WholesaleCustomers from './customers/customers';
import WholesaleRouteDefinitions from './route-definitions/route-definitions';
import WholesaleClosures from './closures/closures';
import WholesaleUsers from './users/users';
import WholesaleSettings from './settings/settings';
import OrderEntry from './sales/order-entry';
import CallList from './sales/call-list';
import CustomerNotes from './sales/customer-notes';
import { WHOLESALE_PAGE_ROLES, WholesalePageKey } from './wholesale-access';

const guard = (page: WholesalePageKey, element: React.ReactNode) => (
  <PrivateRoute hasAnyAuthorities={WHOLESALE_PAGE_ROLES[page]}>{element}</PrivateRoute>
);

const LogisticsRoutes = () => {
  return (
    <ErrorBoundaryRoutes>
      <Route index element={guard('wholesaleOrders', <WholesaleOrders />)} />
      <Route path="create-order" element={guard('createOrder', <ChooseRegister />)} />
      <Route path="order-entry" element={guard('orderEntry', <OrderEntry />)} />
      <Route path="call-list" element={guard('callList', <CallList />)} />
      <Route path="customer-notes" element={guard('customerNotes', <CustomerNotes />)} />
      <Route path="wholesale-orders" element={guard('wholesaleOrders', <WholesaleOrders />)} />
      <Route path="saved-orders" element={guard('savedOrders', <WholesaleSavedOrders />)} />
      <Route path="routes" element={guard('routes', <RoutesPage />)} />
      <Route path="routes/:routeId" element={guard('routes', <RouteOrders />)} />
      <Route path="map" element={guard('map', <LogisticsMap />)} />
      <Route path="customers" element={guard('customers', <WholesaleCustomers />)} />
      <Route path="route-definitions" element={guard('routeDefinitions', <WholesaleRouteDefinitions />)} />
      <Route path="factories" element={guard('factories', <WholesaleFactories />)} />
      <Route path="closures" element={guard('closures', <WholesaleClosures />)} />
      <Route path="users" element={guard('users', <WholesaleUsers />)} />
      <Route path="settings" element={guard('settings', <WholesaleSettings />)} />
      <Route path="theme-preview" element={guard('themePreview', <WholesaleThemePreview />)} />
    </ErrorBoundaryRoutes>
  );
};

export default LogisticsRoutes;
