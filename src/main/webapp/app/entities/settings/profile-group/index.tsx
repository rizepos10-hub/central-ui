import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import ProfileGroupUpdate from './profile-group-update';
import ProfileGroupDeleteDialog from './profile-group-delete-dialog';
import ProfileGroup from "app/entities/settings/profile-group/profile-group";

const ProfileGroupsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<ProfileGroup />} />
    <Route path="new" element={<ProfileGroupUpdate />} />

    <Route path=":id">
      <Route path="edit" element={<ProfileGroupUpdate />} />
      <Route path="delete" element={<ProfileGroupDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ProfileGroupsRoutes;
