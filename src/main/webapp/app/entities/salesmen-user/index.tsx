import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import User from "app/entities/salesmen-user/user";
import UserUpdate from "app/entities/salesmen-user/user-update";
import UserDeleteDialog from "app/entities/salesmen-user/user-delete-dialog";



const SalesmenUserRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={< User />} />
    <Route path="new" element={< UserUpdate/>} />
    <Route path=":id">
      <Route path="edit" element={< UserUpdate />} />
      <Route path="delete" element={< UserDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default SalesmenUserRoutes;
