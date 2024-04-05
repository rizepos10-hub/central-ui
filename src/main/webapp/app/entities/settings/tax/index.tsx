import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import TaxDeleteDialog from './tax-delete-dialog';
import Tax from "app/entities/settings/tax/tax";

const TaxRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Tax />} />
    <Route path=":id">
      <Route path="delete" element={<TaxDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TaxRoutes;
