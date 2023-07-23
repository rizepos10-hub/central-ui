import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Addon from './addon';
import AddonDetail from './addon-detail';
import AddonUpdate from './addon-update';
import AddonDeleteDialog from './addon-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Addon />} />
    <Route path="new" element={<AddonUpdate />} />
    <Route path=":id">
      <Route index element={<AddonDetail />} />
      <Route path="edit" element={<AddonUpdate />} />
      <Route path="delete" element={<AddonDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
