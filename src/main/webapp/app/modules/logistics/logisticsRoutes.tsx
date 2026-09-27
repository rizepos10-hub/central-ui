import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import WholesaleOrders from './wholesale-orders';
import WholesaleSavedOrders from './wholesale-saved-orders';
import RoutesPage from './routes';
import RouteOrders from './route-orders';
import LogisticsMap from './map';
import ChooseRegister from 'app/entities/order/choose-register';
import WholesaleThemePreview from './wholesale-ui/wholesale-theme-preview';

const LogisticsRoutes = () => {
  return (
    <ErrorBoundaryRoutes>
      <Route index element={<WholesaleOrders />} />
      <Route path="create-order" element={<ChooseRegister />} />
      <Route path="wholesale-orders" element={<WholesaleOrders />} />
      <Route path="saved-orders" element={<WholesaleSavedOrders />} />
      <Route path="routes" element={<RoutesPage />} />
      <Route path="routes/:routeId" element={<RouteOrders />} />
      <Route path="map" element={<LogisticsMap />} />
      <Route path="theme-preview" element={<WholesaleThemePreview />} />
    </ErrorBoundaryRoutes>
  );
};

export default LogisticsRoutes;
