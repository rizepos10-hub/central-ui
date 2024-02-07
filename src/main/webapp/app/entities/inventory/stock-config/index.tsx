import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import StockConfig from './stock-config';
import StockConfigUpdate from './stock-config-update';
import StockConfigDeleteDialog from './stock-config-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<StockConfig />} />
    <Route path="new" element={<StockConfigUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<StockConfigUpdate />} />
      <Route path="delete" element={<StockConfigDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
