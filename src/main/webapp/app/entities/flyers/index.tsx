import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import Flyer from './flyer';
import FlyerUpdate from './flyer-update';
import FlyerDeleteDialog from './flyer-delete-dialog';

const FlyerRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Flyer />} />
    <Route path="new" element={<FlyerUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<FlyerUpdate />} />
      <Route path="delete" element={<FlyerDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default FlyerRoutes;
