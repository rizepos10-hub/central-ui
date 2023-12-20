import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

// import Branch from './branch';
import PizzaGroupUpdate from './pizza-group-update';
import PizzaDeleteDialog from './pizza-group-delete-dialog';

const BranchRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PizzaGroupUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PizzaGroupUpdate />} />
      <Route path="delete" element={<PizzaDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default BranchRoutes;
