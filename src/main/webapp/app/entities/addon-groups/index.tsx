import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import AddonGroups from './addon-groups';
import AddonGroupsUpdate from './addon-groups-update';
import AddonGroupsDeleteDialog from './addon-groups-delete-dialog';

const AddonGroupsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<AddonGroups />} />
    <Route path="new" element={<AddonGroupsUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<AddonGroupsUpdate />} />
      <Route path="delete" element={<AddonGroupsDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonGroupsRoutes;
