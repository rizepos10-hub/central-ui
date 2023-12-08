import {Route} from "react-router-dom";
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import React from "react";
import PizzaCrustThicknessUpdate from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness-update";
import PizzaCrustThicknessDeleteDialog
  from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness--delete-dialog";

const PizzaCrustThicknessRoutes = () => (
  <ErrorBoundaryRoutes>
  <Route path="new" element={<PizzaCrustThicknessUpdate />} />

  <Route path=":id">
    <Route path="edit" element={<PizzaCrustThicknessUpdate />} />
    <Route path="delete" element={<PizzaCrustThicknessDeleteDialog />} />
  </Route>
  </ErrorBoundaryRoutes>
)
export default PizzaCrustThicknessRoutes
