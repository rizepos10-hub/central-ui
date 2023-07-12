import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Menu from './menu';
import MenuDetail from './menu-detail';
import MenuUpdate from './menu-update';
import MenuDeleteDialog from './menu-delete-dialog';

const MenuRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Menu />} />
    <Route path="new" element={<MenuUpdate />} />
    <Route path=":id">
      <Route index element={<MenuDetail />} />
      <Route path="edit" element={<MenuUpdate />} />
      <Route path="delete" element={<MenuDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default MenuRoutes;
