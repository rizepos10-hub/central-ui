import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Menu from './menu';
import MenuDeleteDialog from './menu-delete-dialog';
import MenuInstance from './menu-instance';

const MenuRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Menu />} />

    <Route path=":id">
      <Route index element={<MenuInstance />} />
      <Route path="pos/edit" element={<MenuInstance />} />
      <Route path="online_ordering/edit" element={<MenuInstance />} />
      <Route path="delete" element={<MenuDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default MenuRoutes;
