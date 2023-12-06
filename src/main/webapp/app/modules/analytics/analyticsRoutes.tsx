import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

const TopItems = lazy(() => import('app/modules/analytics/TopItems'));
const SalesSummaryReport = lazy(() => import('app/modules/analytics/reports/Reports'));
const EndOfDayReport = lazy(() => import('app/modules/analytics/reports/EndOfDayReport'));
const SalesReport = lazy(() => import('app/modules/analytics/reports/sales-report'));
const EndOfDays = lazy(() => import('app/modules/analytics/reports/end-of-days'));

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Suspense fallback={<div>Loading...</div>}>
          <Route path="topItems" element={<TopItems />} />
          <Route path="endofday" element={<EndOfDays />} />
          <Route path="endofday/:id" element={<EndOfDayReport />} />
          <Route path="reports" element={<SalesSummaryReport />} />
          <Route path="sales" element={<SalesReport />} />
        </Suspense>

        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
