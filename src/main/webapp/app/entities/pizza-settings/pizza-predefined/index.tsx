import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PredefinedPizza from "app/entities/pizza-settings/pizza-predefined/pizza-predefined";
import PredefinedPizzaUpdate from "app/entities/pizza-settings/pizza-predefined/pizza-predefined-update";
import PredefinedPizzaDeleteDialog from "app/entities/pizza-settings/pizza-predefined/pizza-predefined-delete-dialog";



const PizzaSizeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PredefinedPizza />} />
    <Route path="new" element={<PredefinedPizzaUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PredefinedPizzaUpdate />} />
      <Route path="delete" element={<PredefinedPizzaDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PizzaSizeRoutes;
