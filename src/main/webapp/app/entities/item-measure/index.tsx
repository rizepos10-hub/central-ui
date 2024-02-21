import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import ItemMeasure from './item-measure';
import ItemMeasureUpdate from './item-measure-update';
import ItemMeasureDeleteDialog from './item-measure-delete-dialog';

const AddonRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<ItemMeasure />} />
    <Route path="new" element={<ItemMeasureUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<ItemMeasureUpdate />} />
      <Route path="delete" element={<ItemMeasureDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default AddonRoutes;
