import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import TagUpdate from "app/entities/tag/tag-update";
import Tag from "app/entities/tag/tag";
import TagDeleteDialog from "app/entities/tag/tag-delete-dialog";


const RetailAttributesRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Tag />} />
    <Route path="new" element={<TagUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<TagUpdate />} />
      <Route path="delete" element={<TagDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default RetailAttributesRoutes;
