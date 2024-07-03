import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import { Zones } from './zones';
import ZonePage from './zone';


const ZonesSettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Zones />} />
    <Route path="new" element={<ZonePage />} />
    <Route path=":id">
      <Route path="edit" element={<ZonePage />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ZonesSettingsRoutes