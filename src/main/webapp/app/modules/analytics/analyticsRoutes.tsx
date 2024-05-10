

import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import TopItems from "app/modules/analytics/TopItems";
import SalesSummaryReport from "app/modules/analytics/reports/report";
import EndOfDayReport from "app/modules/analytics/reports/end-of-day-report";
import {SalesReport} from "app/modules/analytics/reports/sales-report/sales-report";
import {EndOfDays} from "app/modules/analytics/reports/end-of-days";
import PageNotFound from "app/shared/error/page-not-found";



export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>

        <Route path="topItems" element={<TopItems />} />
        <Route path="endofday" element={<EndOfDays />} />
        <Route path="endofday/:id" element={<EndOfDayReport />} />
        <Route path="reports" element={<SalesSummaryReport />} />
        <Route path="sales" element={<SalesReport />} />
        <Route path="/sales-report/sales-by-:reportType" element={<SalesReport />} />
        <Route path="*" element={<PageNotFound />} />


        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};

