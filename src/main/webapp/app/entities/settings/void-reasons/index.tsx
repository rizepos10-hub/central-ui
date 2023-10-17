import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import VoidReasonsUpdate from './void-reasons-update';
import VoidReasonsDeleteDialog from './void-reasons-delete-dialog';
import VoidReasons from "app/entities/settings/void-reasons/void-reasons";
import TaxProfileEdit from "app/entities/settings/tax-profiles/tax-profile-update";

const VoidReasonsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<VoidReasons />} />
    <Route path="new" element={<VoidReasonsUpdate />} />

    <Route path=":id">
      <Route path="edit" element={<VoidReasonsUpdate />} />

      <Route path="delete" element={<VoidReasonsDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default VoidReasonsRoutes;
