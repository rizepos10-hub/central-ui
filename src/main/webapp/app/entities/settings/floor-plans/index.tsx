import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import FloorPlan from "app/entities/settings/floor-plans/floor-plan";
import CreateFloorPlan from "app/entities/settings/floor-plans/floor-plan-create";
import FloorPlanManageUpdate from "app/entities/settings/floor-plans/floor-plan-manage-update";
import FloorPlanEditUpdate from "app/entities/settings/floor-plans/floor-plan-edit-update";



const FloorPlanRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<FloorPlan />} />
    <Route path="new" element={<CreateFloorPlan />} />
    <Route path=":id">
      <Route path="manage" element={<FloorPlanManageUpdate />} />
      <Route path="edit" element={<FloorPlanEditUpdate />} />
    {/*   <Route path="delete" element={<FloorPlanTableDeleteDialog />} /> */}
    </Route>
  </ErrorBoundaryRoutes>
);

export default FloorPlanRoutes;
