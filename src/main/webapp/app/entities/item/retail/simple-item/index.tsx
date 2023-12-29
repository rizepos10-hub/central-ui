import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import SimpleItem from './simple-item';
import SimpleItemUpdate from './simple-item-update';
import SimpleItemDeleteDialog from './simple-item-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<SimpleItem />} />
    <Route path="new" element={<SimpleItemUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<SimpleItemUpdate />} />
      <Route path="delete" element={<SimpleItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
