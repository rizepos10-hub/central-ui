import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import ServiceCharge from './service-charge';
import ServiceChargeUpdate from './service-charge-update';
import ServiceChargeDeleteDialog from './service-charge-delete-dialog';

const ServiceChargeRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<ServiceCharge />} />
    <Route path="new" element={<ServiceChargeUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<ServiceChargeUpdate />} />
      <Route path="delete" element={<ServiceChargeDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ServiceChargeRoutes;
