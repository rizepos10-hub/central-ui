

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
import RetialDashboard from './reports/retail-dashboard/retail-dashboard';
import SalesReportPrint from './reports/sales-report/sales-report-print';
import InventoryReport from './reports/inventory-report/inventory-report';
import StoreCreditReport from './reports/store-credit-report/store-credit-report';
import HouseChargesReport from './reports/house-charges-report/house-charges-report';
import SalesActivitySummaryReport from './reports/sales-activity-summary-report/sales-activity-summary-report';
import OptimizedProductSalesReport from './reports/optimized-product-sales-report/optimized-product-sales-report';



export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Route path="retail-dashboard" element={<RetialDashboard />} />
        <Route path="topItems" element={<TopItems />} />
        <Route path="endofday" element={<EndOfDays />} />
        <Route path="shift-report" element={<ShiftReport />} />
        <Route path="employee-hours-report" element={<EmployeeHoursReport />} />
        <Route path="endofday/:id" element={<EndOfDayReport />} />
        <Route path="register-closure/*" element={<RegisterClosures />} />
        <Route path="reports" element={<SalesSummaryReport />} />
        <Route path="sales" element={<SalesReport />} />
        <Route path="/sales-report/sales-by-:reportType" element={<SalesReport />} />
        <Route path="/sales-report/print" element={<SalesReportPrint />} />
        <Route path="/inventory-report" element={<InventoryReport />} />
        <Route path="/store-credit-report" element={<StoreCreditReport />} />
        <Route path="/house-charges-report" element={<HouseChargesReport />} />
        <Route path="/sales-activity-summary-report" element={<SalesActivitySummaryReport />} />
        <Route path="/optimized-product-sales-report" element={<OptimizedProductSalesReport />} />
        <Route path="*" element={<PageNotFound />} />
        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};

