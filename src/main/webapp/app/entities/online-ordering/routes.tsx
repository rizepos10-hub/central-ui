import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import UiSettingsUpdate from "app/entities/online-ordering/settings/settings";
import User from "app/entities/online-ordering/user";
import OnlineOrder from "app/entities/online-ordering/online-order/online-order";
import LayoutSettingsUpdate from './layout-settings/layout-settings';
import Layouts from './layouts/layouts';
import OnlineOrderingPages from './pages/pages';
import OnlineOrderingPageEditor from './pages/page-editor';


export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Route>
          <Route path={"settings"} element={<UiSettingsUpdate />} />
          <Route path={"user"} element={<User />} />
          <Route path={"order"} element={<OnlineOrder />} />
          <Route path={"layout-settings"} element={<LayoutSettingsUpdate />} />
          <Route path={"pick-a-layout"} element={<Layouts />} />
          <Route path={"pages"} element={<OnlineOrderingPages />} />
          <Route path={"pages/new"} element={<OnlineOrderingPageEditor />} />
          <Route path={"pages/:id/edit"} element={<OnlineOrderingPageEditor />} />
        </Route>
      </ErrorBoundaryRoutes>
  </div>
);
};
