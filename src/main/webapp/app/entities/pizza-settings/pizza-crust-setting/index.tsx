import React from 'react';
import { Route, Routes } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PizzaCrust from 'app/entities/pizza-settings/pizza-crust-setting/pizza-crust';
import PizzaSizeUpdate from 'app/entities/pizza-settings/pizza-size/pizza-size-update';
import PizzaSizeDeleteDialog from 'app/entities/pizza-settings/pizza-size/pizza-size-delete-dialog';

const PizzaCrustRoutes = () => (
  <ErrorBoundaryRoutes>
      <Route path="/" element={<PizzaCrust />} />

  </ErrorBoundaryRoutes>
);

export default PizzaCrustRoutes;
