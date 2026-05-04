import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import WholesaleOrders from './wholesale-orders';
import RoutesPage from './routes';
import RouteOrders from './route-orders';
import LogisticsMap from './map';
import ChooseBranch from 'app/entities/order/choose-branch';

const LogisticsRoutes = () => {
  return (
    <ErrorBoundaryRoutes>
      <Route index element={<WholesaleOrders />} />
      <Route path="create-order" element={<ChooseBranch />} />
      <Route path="wholesale-orders" element={<WholesaleOrders />} />
      <Route path="routes" element={<RoutesPage />} />
      <Route path="routes/:routeId" element={<RouteOrders />} />
      <Route path="map" element={<LogisticsMap />} />
    </ErrorBoundaryRoutes>
  );
};

export default LogisticsRoutes;
