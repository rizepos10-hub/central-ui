import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PizzaToppingGroup from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group";
import PizzaToppingGroupUpdate from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group-update";
import DeleteToppingGroupDialog from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group-delete-dialog";

const PizzaToppingRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PizzaToppingGroup />} />
    <Route path="new" element={<PizzaToppingGroupUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PizzaToppingGroupUpdate />} />
      <Route path="delete" element={<DeleteToppingGroupDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PizzaToppingRoutes;
