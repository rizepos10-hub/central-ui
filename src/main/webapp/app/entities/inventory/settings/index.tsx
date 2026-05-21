import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import InventorySettingsPage from './inventory-settings';

const InventorySettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<InventorySettingsPage />} />
  </ErrorBoundaryRoutes>
);

export default InventorySettingsRoutes;
