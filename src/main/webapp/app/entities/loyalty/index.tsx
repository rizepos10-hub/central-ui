import ErrorBoundaryRoutes from "app/shared/error/error-boundary-routes";
import {Route} from "react-router-dom";
import React from "react";
import {LoyaltyRecords} from "app/entities/loyalty/LoyaltyRecords";
import {LoyaltyUpdate} from "app/entities/loyalty/LoyaltyUpdate";

const LoyaltyRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<LoyaltyRecords />} />
    <Route path=":id">
      <Route path="edit" element={<LoyaltyUpdate />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default LoyaltyRoutes;
