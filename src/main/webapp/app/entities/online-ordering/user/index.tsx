import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import User from "app/entities/online-ordering/user/user";
// import UserUpdate from "app/entities/online-ordering/user-update";
// import UserDeleteDialog from "app/entities/online-ordering/user-delete-dialog";



const OnlineOrderingRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={< User />} />
    {/* <Route path="new" element={< UserUpdate/>} /> */}
    <Route path=":id">
      {/* <Route path="edit" element={< UserUpdate />} /> */}
      {/* <Route path="delete" element={< UserDeleteDialog />} /> */}
    </Route>
  </ErrorBoundaryRoutes>
);

export default OnlineOrderingRoutes;
