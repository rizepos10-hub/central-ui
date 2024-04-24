import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Product from './product';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Product />} />
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
