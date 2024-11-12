import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Order from './order';
import OrderDetail from './order-detail';
import TodayOrder from "app/entities/order/order-today";
import OrderCreate from './order-create';
import PrintOrder from './print-order';
import PrintBill from './print-bill';
import OrderScheduled from './order-scheduled';

const OrderRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Order />} />
    <Route path="create" element={<OrderCreate />} />
    <Route path="today" element={<TodayOrder />} />
    <Route path="scheduled" element={<OrderScheduled />} /> 

    <Route path=":id">
      <Route path='print' element={<PrintOrder />} />
      <Route path='print/:billId' element={<PrintBill />} />
      <Route index element={<OrderDetail />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default OrderRoutes;
