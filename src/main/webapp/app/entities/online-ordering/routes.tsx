import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import UiSettingsUpdate from "app/entities/online-ordering/settings/settings";
import User from "app/entities/online-ordering/user";


export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Route>
          <Route path={"settings"} element={<UiSettingsUpdate />} />
          <Route path={"user"} element={<User />} />

        </Route>
      </ErrorBoundaryRoutes>
  </div>
);
};
