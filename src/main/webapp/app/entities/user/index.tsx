import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import User from "app/entities/user/user";
import UserUpdate from "app/entities/user/user-update";
import UserDetail from "app/entities/user/user-detail";
import UserDeleteDialog from "app/entities/user/user-delete-dialog";



const UserRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={< User />} />
    <Route path="new" element={< UserUpdate/>} />
    <Route path=":id">
      <Route index element={< UserDetail/>} />
      <Route path="edit" element={< UserUpdate />} />
      <Route path="delete" element={< UserDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default UserRoutes;
