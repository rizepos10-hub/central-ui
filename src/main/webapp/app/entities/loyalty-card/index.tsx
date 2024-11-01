import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import LoyaltyCard from './loyalty-card';
import LoyaltyCardUpdate from './loyalty-card-update';
import LoyaltyCardDeleteDialog from './loyalty-card-delete-dialog';


const LoyaltyCardRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<LoyaltyCard />} />
    <Route path="new" element={<LoyaltyCardUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<LoyaltyCardUpdate />} />
      <Route path="delete" element={<LoyaltyCardDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default LoyaltyCardRoutes;
