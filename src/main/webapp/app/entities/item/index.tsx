import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Item from './item';
import ItemDetail from './item-detail';
import ItemUpdate from './item-update';
import ItemDeleteDialog from './item-delete-dialog';
import TopItems from "app/entities/item/TopITems";

const ItemRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Item />} />
    <Route path="new" element={<ItemUpdate />} />
    <Route path="top" element={<TopItems />} />
    <Route path=":id">
      <Route index element={<ItemDetail />} />
      <Route path="edit" element={<ItemUpdate />} />
      <Route path="delete" element={<ItemDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default ItemRoutes;
