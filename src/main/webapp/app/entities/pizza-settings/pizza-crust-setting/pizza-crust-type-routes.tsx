import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PizzaCrustTypeUpdate from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type-update";
import PizzaCrustTypeDeleteDialog from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type-delete-dialog";

const PizzaCrustTypeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route path="new" element={<PizzaCrustTypeUpdate />} />
      <Route path=":id">
        <Route path="edit" element={<PizzaCrustTypeUpdate />} />
        <Route path="delete" element={<PizzaCrustTypeDeleteDialog />} />
      </Route>
  </ErrorBoundaryRoutes>
);

export default PizzaCrustTypeRoutes;
