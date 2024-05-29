import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import BranchRegistry from "app/entities/settings/branch-registry/branch-registry";
import BranchRegistryUpdate from 'app/entities/settings/branch-registry/branch-registry-update';
import EndOfTillReport from "app/modules/analytics/reports/end-of-till/end-of-till-report";
import CustomDateOrder from "app/entities/order/custom-date-order";

const RegisterClosuresRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<BranchRegistry isRegisterClosure  />} />
    <Route path=":id">
      <Route path="edit" element={<BranchRegistryUpdate isRegisterClosure  />} />
      <Route path="edit/:tillId" element={<EndOfTillReport  />} />
      <Route path=":tillId/orders" element={<CustomDateOrder  />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default RegisterClosuresRoutes;
