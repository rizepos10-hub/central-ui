import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import SenitronSettingsPage from './senitron';

const SenitronSettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<SenitronSettingsPage />} />
  </ErrorBoundaryRoutes>
);

export default SenitronSettingsRoutes;
