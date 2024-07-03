import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import { Branches } from './branch';

const BranchRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Branches />} />
    <Route path=":id">
      {/* <Route path="edit" element={<BranchUpdate />} /> */}
    </Route>
  </ErrorBoundaryRoutes>
);

export default BranchRoutes;
