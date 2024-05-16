import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import BranchRegistry from './branch-registry';
import BranchRegistryUpdate from "app/entities/settings/branch-registry/branch-registry-update";

const BranchRegistryRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<BranchRegistry />} />
    <Route path=":id">
      <Route path="edit" element={<BranchRegistryUpdate />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default BranchRegistryRoutes;
