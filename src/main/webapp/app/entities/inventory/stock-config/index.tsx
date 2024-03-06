import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import StockConfig from './stock-config';
import PurchaseConfigUpdate from './purchase-config-update';
import PurchaseConfigDeleteDialog from './purchase-config-delete-dialog';
import StockQuantityUpdate from "app/entities/inventory/stock-config/stock-quantity-update";

const StockConfigRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<StockConfig />} />

    {/* For Purchase Config */}
    <Route path="purchase-config">
    <Route path="new" element={<PurchaseConfigUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PurchaseConfigUpdate />} />
      <Route path="delete" element={<PurchaseConfigDeleteDialog />} />
    </Route>

    </Route>

    {/* For Stock Quantity */}
    <Route path="stock-quantity">
      <Route path=":id">
        <Route path="edit" element={<StockQuantityUpdate />} />
      </Route>
    </Route>
  </ErrorBoundaryRoutes>
);

export default StockConfigRoutes;
