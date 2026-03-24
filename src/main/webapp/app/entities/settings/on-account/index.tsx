import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import OnAccountSettingsPage from './on-account-settings';

const OnAccountSettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<OnAccountSettingsPage />} />
  </ErrorBoundaryRoutes>
);

export default OnAccountSettingsRoutes;
