import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Attachment from './attachment';
import AttachmentDetail from './attachment-detail';
import AttachmentUpdate from './attachment-update';
import AttachmentDeleteDialog from './attachment-delete-dialog';

const AttachmentRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Attachment />} />
    <Route path="new" element={<AttachmentUpdate />} />
    <Route path=":id">
      <Route index element={<AttachmentDetail />} />
      <Route path="edit" element={<AttachmentUpdate />} />
      <Route path="delete" element={<AttachmentDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AttachmentRoutes;
