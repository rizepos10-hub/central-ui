import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import VoidReasonsDetail from './void-reasons-detail';
import VoidReasonsUpdate from './void-reasons-update';
import VoidReasonsDeleteDialog from './void-reasons-delete-dialog';
import VoidReasons from "app/entities/settings/void-reasons/void-reasons";
import TaxProfileEdit from "app/entities/settings/tax-profiles/tax-profile-update";
// import AddVoidReasonsModal from "app/entities/settings/taxes/AddVoidReasonstModal";

const VoidReasonsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<VoidReasons />} />
    <Route path="new" element={<VoidReasonsUpdate />} />

    <Route path=":id">
      <Route index element={<VoidReasonsDetail />} />
      <Route path="edit" element={<VoidReasonsUpdate />} />

      <Route path="delete" element={<VoidReasonsDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default VoidReasonsRoutes;
