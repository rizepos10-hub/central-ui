import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import VoidReasonUpdate from './void-reason-update';
import VoidReasonDeleteDialog from './void-reason-delete-dialog';
import VoidReason from "app/entities/settings/void-reason/void-reason";
import TaxProfileEdit from "app/entities/settings/tax-profile/tax-profile-update";

const VoidReasonsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<VoidReason />} />
    <Route path="new" element={<VoidReasonUpdate />} />

    <Route path=":id">
      <Route path="edit" element={<VoidReasonUpdate />} />

      <Route path="delete" element={<VoidReasonDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default VoidReasonsRoutes;
