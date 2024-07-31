import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import SalesLocation from './sales-location';
import SalesLocationUpdate from './sales-location-update';
import SalesLocationDeleteDialog from './sales-location-delete-dialog';

const SalesLocationRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<SalesLocation />} />
    <Route path="new" element={<SalesLocationUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<SalesLocationUpdate />} />
      <Route path="delete" element={<SalesLocationDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default SalesLocationRoutes;
