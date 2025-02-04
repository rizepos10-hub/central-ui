import React from 'react';
import { Route, Routes } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PizzaCrust from 'app/entities/pizza-settings/pizza-crust-setting/pizza-crust';
import SelectBasePizza from './select-base-pizza';

const BasePizzaSettingRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route path="/" element={<SelectBasePizza />} />
  </ErrorBoundaryRoutes>
);

export default BasePizzaSettingRoutes;
