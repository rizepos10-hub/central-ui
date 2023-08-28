import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Order from './order';
import OrderDetail from './order-detail';
// import TestOrder from "app/entities/order/TestOrder";
import OrderTesttt from "app/entities/order/OrderTesttt";
import ItemUpdate from "app/entities/item/item-update";
import TodayOrder from "app/entities/order/TodayOrder";

const OrderRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<OrderTesttt />} />
    <Route path="today" element={<TodayOrder />} />

    <Route path=":id">
      <Route index element={<OrderDetail />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default OrderRoutes;
