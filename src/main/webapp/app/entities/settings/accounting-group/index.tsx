import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import AccountingGroupUpdate from './accounting-group-update';
import AccountingGroupDeleteDialog from './accounting-group-delete-dialog';
import AccountingGroup from "app/entities/settings/accounting-group/accounting-group";

const AccountingGroupsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<AccountingGroup />} />
    <Route path="new" element={<AccountingGroupUpdate />} />

    <Route path=":id">
      <Route path="edit" element={<AccountingGroupUpdate />} />
      <Route path="delete" element={<AccountingGroupDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AccountingGroupsRoutes;
