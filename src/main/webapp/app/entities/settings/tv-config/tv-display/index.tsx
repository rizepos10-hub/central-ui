import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import TvDisplay from './tv-display';
import TvDisplayUpdate from './tv-display-update';
import TvDisplayDeleteDialog from './tv-display-delete-dialog';

const TvDisplayRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<TvDisplay />} />
    <Route path="new" element={<TvDisplayUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<TvDisplayUpdate />} />
      <Route path="delete" element={<TvDisplayDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TvDisplayRoutes;
