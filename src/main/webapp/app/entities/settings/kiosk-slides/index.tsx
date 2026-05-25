import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import KioskSlidesSettings from './kiosk-slides';

const KioskSlidesSettingsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<KioskSlidesSettings />} />
  </ErrorBoundaryRoutes>
);

export default KioskSlidesSettingsRoutes;
