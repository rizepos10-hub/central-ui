import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PizzaSize from './pizza-size';
import PizzaSizeUpdate from './pizza-size-update';
import PizzaSizeDeleteDialog from './pizza-size-delete-dialog';

const PizzaSizeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PizzaSize />} />
    <Route path="new" element={<PizzaSizeUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PizzaSizeUpdate />} />
      <Route path="delete" element={<PizzaSizeDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PizzaSizeRoutes;
