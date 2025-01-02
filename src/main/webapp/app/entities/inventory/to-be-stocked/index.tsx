import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import { ToBeStocked } from './to-be-stocked';

const SupplierReturnRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<ToBeStocked />} />
    <Route path=":id">
    </Route>
  </ErrorBoundaryRoutes>
);

export default SupplierReturnRoutes;
