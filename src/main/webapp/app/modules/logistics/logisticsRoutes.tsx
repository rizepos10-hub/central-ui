import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import WarehouseOrders from './warehouse-orders';
import RoutesPage from './routes';
import RouteOrders from './route-orders';
import LogisticsMap from './map';

const LogisticsRoutes = () => {
  return (
    <ErrorBoundaryRoutes>
      <Route index element={<WarehouseOrders />} />
      <Route path="warehouse-orders" element={<WarehouseOrders />} />
      <Route path="routes" element={<RoutesPage />} />
      <Route path="routes/:routeId" element={<RouteOrders />} />
      <Route path="map" element={<LogisticsMap />} />
    </ErrorBoundaryRoutes>
  );
};

export default LogisticsRoutes;
