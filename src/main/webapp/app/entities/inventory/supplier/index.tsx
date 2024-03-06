import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Supplier from './supplier';
import SupplierUpdate from './supplier-update';
import SupplierDeleteDialog from './supplier-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Supplier />} />
    <Route path="new" element={<SupplierUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<SupplierUpdate />} />
      <Route path="delete" element={<SupplierDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
