import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import TookanSettings from './tookan';

const TookanSettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<TookanSettings />} />
  </ErrorBoundaryRoutes>
);

export default TookanSettingsRoutes;
