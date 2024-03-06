import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import SupplierReturn from './supplier-return';
import SupplierReturnUpdate from './supplier-return-update';
import SupplierReturnDeleteDialog from './supplier-return-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<SupplierReturn />} />
    <Route path="new" element={<SupplierReturnUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<SupplierReturnUpdate />} />
      <Route path="delete" element={<SupplierReturnDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
