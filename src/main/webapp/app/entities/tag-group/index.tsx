import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import TagGroup from "app/entities/tag-group/tag-group";
import TagGroupUpdate from "app/entities/tag-group/tag-group-update";
import TagGroupDeleteDialog from "app/entities/tag-group/tag-group-delete-dialog";


const RetailAttributesRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<TagGroup />} />
    <Route path="new" element={<TagGroupUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<TagGroupUpdate />} />
      <Route path="delete" element={<TagGroupDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default RetailAttributesRoutes;
