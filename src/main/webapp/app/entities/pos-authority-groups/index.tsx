import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PosAuthorityGroup from './pos-authority-group';
import PosAuthorityGroupUpdate from './pos-authority-group-update';
import PosAuthorityGroupDeleteDialog from './pos-authority-group-delete-dialog';

const PosAuthorityGroupRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={< PosAuthorityGroup />} />
    <Route path="new" element={< PosAuthorityGroupUpdate />} />
    <Route path=":id">
      <Route path="edit" element={< PosAuthorityGroupUpdate />} />
      <Route path="delete" element={< PosAuthorityGroupDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PosAuthorityGroupRoutes;
