import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Product from './product';
import ProductUpdate from 'app/entities/item/retail/product/product-update';
import ProductDeleteDialog from 'app/entities/item/retail/product/product-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Product />} />
    <Route path="new" element={<ProductUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<ProductUpdate />} />
      <Route path="delete" element={<ProductDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
