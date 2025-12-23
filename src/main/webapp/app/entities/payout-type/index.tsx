import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PayoutType from './payout-type';
import PayoutTypeUpdate from './payout-type-update';
import PayoutTypeDeleteDialog from './payout-type-delete-dialog';

const PayoutTypeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PayoutType />} />
    <Route path="new" element={<PayoutTypeUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PayoutTypeUpdate />} />
      <Route path="delete" element={<PayoutTypeDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PayoutTypeRoutes;
