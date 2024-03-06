import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import TransferRequest from './transfer-request';
import TransferRequestUpdate from './transfer-request-update';
import TransferRequestDeleteDialog from './transfer-request-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<TransferRequest />} />
    <Route path="new" element={<TransferRequestUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<TransferRequestUpdate />} />
      <Route path="delete" element={<TransferRequestDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
