import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Customer from './customer';
import CustomerUpdate from './customer-update';
import CustomerDeleteDialog from './customer-delete-dialog';
import PrivateRoute from "app/shared/auth/private-route";
import {AUTHORITIES} from "app/config/constants";
import {LoyaltyRecords} from "app/entities/loyalty/LoyaltyRecords";

const CustomerRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Customer />} />
    <Route path="new" element={<CustomerUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<CustomerUpdate />} />
      <Route path="delete" element={<CustomerDeleteDialog />} />
    </Route>
    <Route
      path="loyalty"
      element={
        <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.USER]}>
          <LoyaltyRecords />
        </PrivateRoute>
      }
    />
  </ErrorBoundaryRoutes>
);

export default CustomerRoutes;
