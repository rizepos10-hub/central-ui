import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PizzaSettings from './pizza-settings';

const BasePizzaSettingRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route path="/" element={<PizzaSettings />} />
  </ErrorBoundaryRoutes>
);

export default BasePizzaSettingRoutes;
