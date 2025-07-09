import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Tv from './tv';
import TvUpdate from './tv-update';
import TvDeleteDialog from './tv-delete-dialog';
import TVViewer from './tv-viewer';

const TvRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Tv />} />
    <Route path="new" element={<TvUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<TvUpdate />} />
      <Route path="delete" element={<TvDeleteDialog />} />
      <Route path="view" element={<TVViewer />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TvRoutes;
