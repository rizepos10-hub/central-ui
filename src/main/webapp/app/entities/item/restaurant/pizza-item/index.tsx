import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PizzaItem from './pizza-item';
import PizzaItemUpdate from './pizza-item-update';
import PizzaItemDeleteDialog from './pizza-item-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PizzaItem />} />
    <Route path="new" element={<PizzaItemUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PizzaItemUpdate />} />
      <Route path="delete" element={<PizzaItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
