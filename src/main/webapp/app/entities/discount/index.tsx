import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Discount from './discount';
import DiscountDetail from './discount-detail';
import DiscountUpdate from './discount-update';
import DiscountDeleteDialog from './discount-delete-dialog';

const DiscountRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Discount />} />
    <Route path="new" element={<DiscountUpdate />} />
    <Route path=":id">
      <Route index element={<DiscountDetail />} />
      <Route path="edit" element={<DiscountUpdate />} />
      <Route path="delete" element={<DiscountDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default DiscountRoutes;
