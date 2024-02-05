import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Warehouse from './warehouse';
import WarehouseUpdate from './warehouse-update';
import WarehouseDeleteDialog from './warehouse-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Warehouse />} />
    <Route path="new" element={<WarehouseUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<WarehouseUpdate />} />
      <Route path="delete" element={<WarehouseDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
