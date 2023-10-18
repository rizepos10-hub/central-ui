import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import TaxProfileDeleteDialog from './tax-profile-delete-dialog';
import TaxProfile from "app/entities/settings/tax-profiles/tax-profile";
import TaxProfileEdit from "app/entities/settings/tax-profiles/tax-profile-update";


const TaxRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<TaxProfile />} />
    <Route path="new" element={<TaxProfileEdit />} />

    <Route path=":id">
      <Route index element={<TaxProfileEdit />} />
      <Route path="edit" element={<TaxProfileEdit />} />
      <Route path="delete" element={<TaxProfileDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TaxRoutes;
