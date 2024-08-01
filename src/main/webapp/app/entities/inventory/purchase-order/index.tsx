import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import PurchaseOrder from './purchase-order';
import PurchaseOrderUpdate from './purchase-order-update';
import PurchaseOrderDeleteDialog from './purchase-order-delete-dialog';

const PurchaseOrderRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PurchaseOrder />} />
    <Route path="new" element={<PurchaseOrderUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PurchaseOrderUpdate />} />
      <Route path="delete" element={<PurchaseOrderDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PurchaseOrderRoutes;
