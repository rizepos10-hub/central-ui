import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PizzaPricingClass from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class";
import PizzaPricingClassTypeUpdate from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class-update";
import PizzaPricingClassDeleteDialog from "app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class-delete-dialog";



const PizzaSizeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PizzaPricingClass />} />
    <Route path="new" element={<PizzaPricingClassTypeUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PizzaPricingClassTypeUpdate />} />
      <Route path="delete" element={<PizzaPricingClassDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PizzaSizeRoutes;
