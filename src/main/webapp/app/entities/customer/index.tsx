import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Customer from './customer';
import CustomerDetail from './customer-detail';
import CustomerUpdate from './customer-update';
import CustomerDeleteDialog from './customer-delete-dialog';
import CustomerTest from "app/entities/customer/CustomerTest";

const CustomerRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CustomerTest />} />
    <Route path="new" element={<CustomerUpdate />} />
    <Route path=":id">
      <Route index element={<CustomerDetail />} />
      <Route path="edit" element={<CustomerUpdate />} />
      <Route path="delete" element={<CustomerDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default CustomerRoutes;
