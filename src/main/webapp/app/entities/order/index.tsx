import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Order from './order';
import OrderDetail from './order-detail';
import TodayOrder from "app/entities/order/order-today";
import OrderCreate from './order-create';

const OrderRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Order />} />
    <Route path="create" element={<OrderCreate />} />
    <Route path="today" element={<TodayOrder />} />

    <Route path=":id">
      <Route index element={<OrderDetail />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default OrderRoutes;
