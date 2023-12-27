import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Item from './item';
import ItemUpdate from './item-update';
import ItemDeleteDialog from './item-delete-dialog';
import VariantView from "app/entities/regalar-item/variant-view";

const ItemRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Item />} />
    <Route path="new" element={<ItemUpdate />} />
    <Route path=":id">
      <Route path="edit" element={<ItemUpdate />} />
      <Route path="delete" element={<ItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ItemRoutes;
