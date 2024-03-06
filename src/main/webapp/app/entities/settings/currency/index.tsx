import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Currency from './currency';


const CurrencySettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Currency />} />
  </ErrorBoundaryRoutes>
);

export default CurrencySettingsRoutes;
