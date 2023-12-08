import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PizzaTopping from './pizza-topping';
import PizzaToppingUpdate from './pizza-topping-update';
import PizzaToppingDeleteDialog from './pizza-topping-delete-dialog';

const PizzaToppingRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PizzaTopping />} />
    <Route path="new" element={<PizzaToppingUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PizzaToppingUpdate />} />
      <Route path="delete" element={<PizzaToppingDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PizzaToppingRoutes;
