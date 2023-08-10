import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Order from './order';
import OrderDetail from './order-detail';
// import TestOrder from "app/entities/order/TestOrder";
import OrderTesttt from "app/entities/order/OrderTesttt";

const OrderRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<OrderTesttt />} />
    <Route path=":id">
      <Route index element={<OrderDetail />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default OrderRoutes;
