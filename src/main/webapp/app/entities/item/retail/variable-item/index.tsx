import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import VariableItem from './variable-item';
import VariableItemUpdate from './variable-item-update';
import VariableItemDeleteDialog from './variable-item-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<VariableItem />} />
    <Route path="new" element={<VariableItemUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<VariableItemUpdate />} />
      <Route path="delete" element={<VariableItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
