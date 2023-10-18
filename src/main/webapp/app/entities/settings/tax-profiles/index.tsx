import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import TaxProfileDetail from './tax-profile-detail';
import TaxProfileUpdate from './tax-profile-update';
import TaxProfileDeleteDialog from './tax-profile-delete-dialog';
import TaxProfile from "app/entities/settings/tax-profiles/Tax-Profile";
import TaxProfileEdit from "app/entities/settings/tax-profiles/tax-profile-update";
import AddonUpdate from "app/entities/addon/addon-update";


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
