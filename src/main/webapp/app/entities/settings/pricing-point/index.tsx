import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import { PricingPoint } from './pricing-point';
import { PricingPointUpdate } from './pricing-point-update';
import PrinterDeleteDialog from '../printing/printer/printer-delete-dialog';

const PricingPointRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PricingPoint />} />
    <Route path="new" element={<PricingPointUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PricingPointUpdate />} />
      <Route path="delete" element={<PrinterDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PricingPointRoutes;
