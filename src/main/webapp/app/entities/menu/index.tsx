import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Menu from './menu';
import MenuDeleteDialog from './menu-delete-dialog';
import NewMenuPopup from "app/entities/menu/new-menu-popup";
import PosMenuUpdate from "app/entities/menu/pos-menu-update";
import OnlineOrderingMenuUpdate from "app/entities/menu/online-ordering-menu-update"

const MenuRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Menu />} />
    <Route path="new" element={<NewMenuPopup />} />

    <Route path=":id">
      <Route index element={<PosMenuUpdate />} />
      <Route path="pos/edit" element={<PosMenuUpdate />} />
      <Route path="online_ordering/edit" element={<OnlineOrderingMenuUpdate />} />
      <Route path="delete" element={<MenuDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default MenuRoutes;
