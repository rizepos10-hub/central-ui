import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import FloorPlanTable from './table';
import FloorPlanTableUpdate from './table-update';
import FloorPlanTableDeleteDialog from './table-delete-dialog';

const FloorPlanTableRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<FloorPlanTable />} />
    <Route path="new" element={<FloorPlanTableUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<FloorPlanTableUpdate />} />
      <Route path="delete" element={<FloorPlanTableDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default FloorPlanTableRoutes;
