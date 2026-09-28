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
import OrderSheets from './operations/order-sheets';
import Production from './operations/production';
import LoadingLists from './operations/loading-lists';
import FactoryOrders from './operations/factory-orders';
import FactoryOrderDetail from './operations/factory-order-detail';
import FactoryFulfillment from './operations/factory-fulfillment';
import WholesaleHome from './operations/wholesale-home';
import DeliveryRuns from './delivery/delivery-runs';
import CashHandover from './delivery/cash-handover';
import StaleReturns from './delivery/stale-returns';
import CreditMemos from './delivery/credit-memos';
import Dashboard from './audits/dashboard';
import Reconciliation from './audits/reconciliation';
import Alerts from './audits/alerts';
import CustomerAccounts from './audits/customer-accounts';
import Invoices from './audits/invoices';
import LiveRoute from './audits/live-route';
import WholesaleHelp from './help/help';
import { WHOLESALE_PAGE_ROLES, WholesalePageKey } from './wholesale-access';

const guard = (page: WholesalePageKey, element: React.ReactNode) => (
  <PrivateRoute hasAnyAuthorities={WHOLESALE_PAGE_ROLES[page]}>{element}</PrivateRoute>
);

const LogisticsRoutes = () => {
  return (
    <ErrorBoundaryRoutes>
      <Route index element={<WholesaleHome />} />
      <Route path="create-order" element={guard('createOrder', <ChooseRegister />)} />
      <Route path="order-entry" element={guard('orderEntry', <OrderEntry />)} />
      <Route path="call-list" element={guard('callList', <CallList />)} />
      <Route path="customer-notes" element={guard('customerNotes', <CustomerNotes />)} />
      <Route path="wholesale-orders" element={guard('wholesaleOrders', <WholesaleOrders />)} />
      <Route path="saved-orders" element={guard('savedOrders', <WholesaleSavedOrders />)} />
      <Route path="routes" element={guard('routes', <RoutesPage />)} />
      <Route path="routes/:routeId" element={guard('routes', <RouteOrders />)} />
      <Route path="map" element={guard('map', <LogisticsMap />)} />
      <Route path="order-sheets" element={guard('orderSheets', <OrderSheets />)} />
      <Route path="production" element={guard('production', <Production />)} />
      <Route path="loading-lists" element={guard('loadingLists', <LoadingLists />)} />
      <Route path="factory-orders" element={guard('factoryOrders', <FactoryOrders />)} />
      <Route path="factory-orders/:id" element={guard('factoryOrders', <FactoryOrderDetail />)} />
      <Route path="factory-fulfillment" element={guard('factoryFulfillment', <FactoryFulfillment />)} />
      <Route path="delivery-runs" element={guard('deliveryRuns', <DeliveryRuns />)} />
      <Route path="cash-handover" element={guard('cashHandover', <CashHandover />)} />
      <Route path="stale-returns" element={guard('staleReturns', <StaleReturns />)} />
      <Route path="credit-memos" element={guard('creditMemos', <CreditMemos />)} />
      <Route path="dashboard" element={guard('dashboard', <Dashboard />)} />
      <Route path="live-route" element={guard('liveRoute', <LiveRoute />)} />
      <Route path="reconciliation" element={guard('reconciliation', <Reconciliation />)} />
      <Route path="alerts" element={guard('alerts', <Alerts />)} />
      <Route path="customer-accounts" element={guard('customerAccounts', <CustomerAccounts />)} />
      <Route path="invoices" element={guard('invoices', <Invoices />)} />
      <Route path="customers" element={guard('customers', <WholesaleCustomers />)} />
      <Route path="route-definitions" element={guard('routeDefinitions', <WholesaleRouteDefinitions />)} />
      <Route path="factories" element={guard('factories', <WholesaleFactories />)} />
      <Route path="closures" element={guard('closures', <WholesaleClosures />)} />
      <Route path="users" element={guard('users', <WholesaleUsers />)} />
      <Route path="settings" element={guard('settings', <WholesaleSettings />)} />
      <Route path="theme-preview" element={guard('themePreview', <WholesaleThemePreview />)} />
      <Route path="help" element={guard('help', <WholesaleHelp />)} />
    </ErrorBoundaryRoutes>
  );
};

export default LogisticsRoutes;
