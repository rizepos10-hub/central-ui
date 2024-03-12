import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import UiSettingsUpdate from "app/entities/online-ordering/settings/settings";


export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Route>
          <Route path={"settings"} element={<UiSettingsUpdate />} />

        </Route>
      </ErrorBoundaryRoutes>
  </div>
);
};
