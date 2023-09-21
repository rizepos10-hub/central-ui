import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Business from './business';
import BusinessDetail from './business-detail';
import BusinessDetailUpdate from './business-detail-update';

const BusinessDetailRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<BusinessDetailUpdate />} />
    <Route path="new" element={<BusinessDetailUpdate />} />
    <Route path=":id">
      <Route index element={<BusinessDetail />} />
      <Route path="edit" element={<BusinessDetailUpdate />} />
      {/*<Route path="delete" element={<DiscountDeleteDialog />} />*/}
    </Route>
  </ErrorBoundaryRoutes>
);

export default BusinessDetailRoutes;
