import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import CashPayment from './cash-payment';

const CashPaymentRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<CashPayment />} />
  </ErrorBoundaryRoutes>
);

export default CashPaymentRoutes;
