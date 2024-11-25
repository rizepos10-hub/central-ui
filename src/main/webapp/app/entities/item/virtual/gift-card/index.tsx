import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import GiftCardItem from './giftcard-item';
import GiftCardItemUpdate from './giftcard-item-update';
import GiftCardItemDeleteDialog from './giftcard-item-delete-dialog';

const GiftCardsRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<GiftCardItem />} />
    <Route path="new" element={<GiftCardItemUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<GiftCardItemUpdate />} />
      <Route path="delete" element={<GiftCardItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default GiftCardsRoutes;
