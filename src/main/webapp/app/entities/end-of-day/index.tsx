import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import EndOfDay from './end-of-day';

const EndOfDayRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<EndOfDay />} />
  </ErrorBoundaryRoutes>
);

export default EndOfDayRoutes;
