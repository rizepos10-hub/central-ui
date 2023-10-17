import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Taxonomy from './taxonomy';
import TaxonomyUpdate from './taxonomy-update';
import TaxonomyDeleteDialog from './taxonomy-delete-dialog';

const TaxonomyRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Taxonomy />} />
    <Route path="new" element={<TaxonomyUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<TaxonomyUpdate />} />
      <Route path="delete" element={<TaxonomyDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default TaxonomyRoutes;
