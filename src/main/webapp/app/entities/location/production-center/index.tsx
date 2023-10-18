import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import ProductionCenter from './production-center';
import ProductionCenterUpdate from './production-center-update';
import ProductionCenterDeleteDialog from './production-center-delete-dialog';

const ProductionCenterRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<ProductionCenter />} />
    <Route path="new" element={<ProductionCenterUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<ProductionCenterUpdate />} />
      <Route path="delete" element={<ProductionCenterDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ProductionCenterRoutes;
