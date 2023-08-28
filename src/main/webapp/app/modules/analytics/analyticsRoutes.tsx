

import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import TopItems from "app/modules/analytics/TopItems";
import SalesSummaryReport from "app/modules/analytics/reports/Reports";
import EndOFDayReport from "app/modules/analytics/reports/EndOfDayReport";



export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Route path="topItems" element={<TopItems />} />
        <Route path="endofday" element={<EndOFDayReport />} />
        <Route path="reports" element={<SalesSummaryReport />} />


        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};

