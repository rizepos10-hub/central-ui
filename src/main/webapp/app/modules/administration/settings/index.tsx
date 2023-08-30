import React from 'react';

import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PrivateRoute from "app/shared/auth/private-route";
import { AUTHORITIES } from 'app/config/constants';
import EntitiesRoutes from "app/entities/routes";
import Menu from "app/entities/menu";
import Tax from "app/modules/administration/settings/Taxes";

const SettingRoutes = () => (
  <div>
  <ErrorBoundaryRoutes>

          <Route path="taxes" element={<Tax />} />
  </ErrorBoundaryRoutes>

  </div>
);

export default SettingRoutes;
