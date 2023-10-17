import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Business from './business';
import BusinessDetailUpdate from './business-detail-update';

const BusinessDetailRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<BusinessDetailUpdate />} />
    <Route path="new" element={<BusinessDetailUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<BusinessDetailUpdate />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default BusinessDetailRoutes;
