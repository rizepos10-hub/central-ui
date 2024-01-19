import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import ComboItem from './combo-item';
import ComboItemUpdate from './combo-item-update';
import ComboItemDeleteDialog from './combo-item-delete-dialog';

const ComboItemRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<ComboItem />} />
    <Route path="new" element={<ComboItemUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<ComboItemUpdate />} />
      <Route path="delete" element={<ComboItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ComboItemRoutes;
