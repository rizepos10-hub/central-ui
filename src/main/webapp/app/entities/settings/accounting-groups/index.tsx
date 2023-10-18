import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import AccountingGroupsUpdate from './accounting-groups-update';
import AccountingGroupsDeleteDialog from './accounting-groups-delete-dialog';
import AccountingGroups from "app/entities/settings/accounting-groups/accounting-groups";

const AccountingGroupsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<AccountingGroups />} />
    <Route path="new" element={<AccountingGroupsUpdate />} />

    <Route path=":id">
      <Route path="edit" element={<AccountingGroupsUpdate />} />
      <Route path="delete" element={<AccountingGroupsDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AccountingGroupsRoutes;
