import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Menu from './menu';
import MenuDeleteDialog from './menu-delete-dialog';
import NewMenuPopup from "app/entities/menu/new-menu-popup";
import MenuUpdate from "app/entities/menu/menu-update-latest";

const MenuRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Menu />} />
    <Route path="new" element={<NewMenuPopup />} />

    <Route path=":id">
      <Route index element={<MenuUpdate />} />
      <Route path="edit" element={<MenuUpdate />} />
      <Route path="delete" element={<MenuDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default MenuRoutes;
