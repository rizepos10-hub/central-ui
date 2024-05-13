import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import BranchRegistry from './branch-registry';

const BranchRegistryRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<BranchRegistry />} />
  </ErrorBoundaryRoutes>
);

export default BranchRegistryRoutes;
