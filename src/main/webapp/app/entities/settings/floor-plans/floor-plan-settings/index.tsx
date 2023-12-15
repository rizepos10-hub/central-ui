import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import FloorPlanSettingsUpdate from "app/entities/settings/floor-plans/floor-plan-settings/floor-plan-settings-update";



const FloorPlanSettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<FloorPlanSettingsUpdate />} />
  </ErrorBoundaryRoutes>
);

export default FloorPlanSettingsRoutes;
