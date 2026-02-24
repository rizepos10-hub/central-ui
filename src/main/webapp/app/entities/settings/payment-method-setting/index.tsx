import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PaymentMethodSetting from './payment-method-setting';
import PaymentMethodSettingUpdate from './payment-method-setting-update';
import PaymentMethodSettingDeleteDialog from './payment-method-setting-delete-dialog';

const PaymentMethodSettingRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<PaymentMethodSetting />} />
    <Route path="new" element={<PaymentMethodSettingUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<PaymentMethodSettingUpdate />} />
      <Route path="delete" element={<PaymentMethodSettingDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default PaymentMethodSettingRoutes;
