import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import AccountingGroupsDetail from './accounting-groups-detail';
import AccountingGroupsUpdate from './accounting-groups-update';
import AccountingGroupsDeleteDialog from './accounting-groups-delete-dialog';
import AccountingGroups from "app/entities/settings/accounting-groups/accounting-groups";
import TaxProfileEdit from "app/entities/settings/tax-profiles/tax-profile-update";
// import AddAccountingGroupsModal from "app/entities/settings/taxes/AddAccountingGroupstModal";

const AccountingGroupsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<AccountingGroups />} />
    <Route path="new" element={<AccountingGroupsUpdate />} />

    <Route path=":id">
      <Route index element={<AccountingGroupsDetail />} />
      <Route path="edit" element={<AccountingGroupsUpdate />} />

      <Route path="delete" element={<AccountingGroupsDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AccountingGroupsRoutes;
