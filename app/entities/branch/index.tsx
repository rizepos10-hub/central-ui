import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Branch from './branch';
import BranchDetail from './branch-detail';
import BranchUpdate from './branch-update';
import BranchDeleteDialog from './branch-delete-dialog';

const BranchRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Branch />} />
    <Route path="new" element={<BranchUpdate />} />
    <Route path=":id">
      <Route index element={<BranchDetail />} />
      <Route path="edit" element={<BranchUpdate />} />
      <Route path="delete" element={<BranchDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default BranchRoutes;
