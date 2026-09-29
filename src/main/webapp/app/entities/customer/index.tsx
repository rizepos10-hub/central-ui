import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import { WholesaleThemeScope } from 'app/modules/logistics/wholesale-ui/wholesale-page';

import Customer from './customer';
import CustomerDashboard from './customer-dashboard';
import CustomerUpdate from './customer-update';
import CustomerDeleteDialog from './customer-delete-dialog';


const CustomerRoutes = () => (
  <WholesaleThemeScope>
    <ErrorBoundaryRoutes>
      <Route index element={<Customer />} />
      <Route path="new" element={<CustomerUpdate />} />
      <Route path=":id">
        <Route index element={<CustomerDashboard />} />
        <Route path="edit" element={<CustomerUpdate />} />
        <Route path="delete" element={<CustomerDeleteDialog />} />
      </Route>
    </ErrorBoundaryRoutes>
  </WholesaleThemeScope>
);

export default CustomerRoutes;
