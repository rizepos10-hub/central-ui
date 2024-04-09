import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import RegularItem from './regular-item';
import RegularItemUpdate from './regular-item-update';
import RegularItemDeleteDialog from './regular-item-delete-dialog';

const ComboItemRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<RegularItem />} />
    <Route path="new" element={<RegularItemUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<RegularItemUpdate />} />
      <Route path="delete" element={<RegularItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ComboItemRoutes;
