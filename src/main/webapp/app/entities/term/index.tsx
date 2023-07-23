import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Term from './term';
import TermDetail from './term-detail';
import TermUpdate from './term-update';
import TermDeleteDialog from './term-delete-dialog';

const TermRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Term />} />
    <Route path="new" element={<TermUpdate />} />
    <Route path=":id">
      <Route index element={<TermDetail />} />
      <Route path="edit" element={<TermUpdate />} />
      <Route path="delete" element={<TermDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TermRoutes;
