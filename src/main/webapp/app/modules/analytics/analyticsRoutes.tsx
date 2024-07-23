

import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import TopItems from "app/modules/analytics/TopItems";
import SalesSummaryReport from "app/modules/analytics/reports/summary-report";
import EndOfDayReport from "app/modules/analytics/reports/end-of-day/end-of-day-report";
import {SalesReport} from "app/modules/analytics/reports/sales-report/sales-report";
import {EndOfDays} from "app/modules/analytics/reports/end-of-day/end-of-days";
import PageNotFound from "app/shared/error/page-not-found";
import RegisterClosures from "app/modules/analytics/register-closures";
import ShiftReport from "app/modules/analytics/reports/shit/shift-report";
import EmployeeHoursReport from './reports/employee-hours/employee-hours';



export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>

        <Route path="topItems" element={<TopItems />} />
        <Route path="endofday" element={<EndOfDays />} />
        <Route path="shift-report" element={<ShiftReport />} />
        <Route path="employee-hours-report" element={<EmployeeHoursReport />} />
        <Route path="endofday/:id" element={<EndOfDayReport />} />
        <Route path="register-closure/*" element={<RegisterClosures />} />
        <Route path="reports" element={<SalesSummaryReport />} />
        <Route path="sales" element={<SalesReport />} />
        <Route path="/sales-report/sales-by-:reportType" element={<SalesReport />} />
        <Route path="*" element={<PageNotFound />} />


        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};

