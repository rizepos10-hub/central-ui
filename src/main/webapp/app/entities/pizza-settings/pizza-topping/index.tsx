import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PizzaTopping from './pizza-topping';
import PizzaToppingUpdate from './pizza-topping-update';
import PizzaToppingDeleteDialog from './pizza-topping-delete-dialog';
import PizzaToppingGroup from "app/entities/pizza-settings/pizza-topping/pizza-topping-group";
import PizzaToppingGroupUpdate from "app/entities/pizza-settings/pizza-topping/pizza-topping-group-update";
import DeleteToppingGroupDialog from "app/entities/pizza-settings/pizza-topping/pizza-topping-group-delete-dialog";

const PizzaToppingRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PizzaTopping />} />
    <Route path="new" element={<PizzaToppingUpdate />} />
    <Route path="new-group" element={<PizzaToppingGroupUpdate />} />
    <Route path="groups" element={<PizzaToppingGroup />} />
    <Route path=":id">
      <Route path="edit" element={<PizzaToppingUpdate />} />
      <Route path="delete" element={<PizzaToppingDeleteDialog />} />
      <Route path="edit-group" element={<PizzaToppingGroupUpdate />} />
      <Route path="delete-group" element={<DeleteToppingGroupDialog />} />

    </Route>
  </ErrorBoundaryRoutes>
);

export default PizzaToppingRoutes;
