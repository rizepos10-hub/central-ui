import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import TaxDetail from './tax-detail';
import TaxUpdate from './tax-update';
import TaxDeleteDialog from './tax-delete-dialog';
import Tax from "app/entities/settings/taxes/Taxes";
import AddTaxModal from "app/entities/settings/taxes/AddTaxtModal";

const TaxRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Tax />} />
    <Route path=":id">
      <Route index element={<TaxDetail />} />
      <Route path="delete" element={<TaxDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TaxRoutes;
