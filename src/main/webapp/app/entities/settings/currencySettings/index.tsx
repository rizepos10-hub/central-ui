import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import CurrencySettings from './currency-settings';


const CurrencySettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CurrencySettings />} />
  </ErrorBoundaryRoutes>
);

export default CurrencySettingsRoutes;
