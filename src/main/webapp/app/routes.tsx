import React, { useState } from 'react';
import { Route, useLocation } from 'react-router-dom';
import Loadable from 'react-loadable';

import Login from 'app/modules/login/login';
import Register from 'app/modules/account/register/register';
import Activate from 'app/modules/account/activate/activate';
import PasswordResetInit from 'app/modules/account/password-reset/init/password-reset-init';
import PasswordResetFinish from 'app/modules/account/password-reset/finish/password-reset-finish';
import Logout from 'app/modules/login/logout';
import Home from 'app/shared/layout/home/home';
import AnalyticsRoutes from "app/modules/analytics/analyticsRoutes";
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PageNotFound from 'app/shared/error/page-not-found';
import { AUTHORITIES } from 'app/config/constants';
import { sendActivity } from 'app/config/websocket-middleware';
import Instructions from "app/modules/instructions/instructions";
import BusinessDetailRoutes from "app/entities/settings/business-details";
import AppConfig from "app/shared/sidebar/AppConfig";
import InventoryRoutes from "app/entities/inventory/routes";
import { getTenantFromURL } from './app';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import PrivateRoute from './shared/auth/private-route';

const loading = <div>loading ...</div>;

const Account = Loadable({
  loader: () => import(/* webpackChunkName: "account" */ 'app/modules/account'),
  loading: () => loading,
});

const Admin = Loadable({
  loader: () => import(/* webpackChunkName: "administration" */ 'app/modules/administration'),
  loading: () => loading,
});

const EntitiesRoutes = Loadable({
  loader: () => import(/* webpackChunkName: "entities" */ 'app/entities/routes'),
  loading: () => loading,
}); 

const AppRoutes = () => {
  const location = useLocation();
  const tenant = getTenantFromURL();

  const [tenantName, setTenantName] = useState(tenant);

  React.useEffect(() => {
    // sendActivity(location.pathname);
  }, [location]);

  const handleSubmit = (e) => {
    e.preventDefault();
    window.location.href = `/${tenantName}/`;
  };

  if (!tenant)
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        <Card className="shadow-lg border-0" style={{ maxWidth: "450px", width: "100%" }}>
          <div className="text-center mb-4">
            <i className="pi pi-building text-primary" style={{ fontSize: "2rem" }}></i>
            <h2 className="mt-3 mb-1">Welcome To Rize POS</h2>
            <p className="text-muted">Tenant Access - Enter your tenant name to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div className="form-group">
              <label htmlFor="tenantName" className="form-label fw-semibold">
                Tenant Name
              </label>
              <div className="p-inputgroup">
                <span className="p-inputgroup-addon">
                  <i className="pi pi-building"></i>
                </span>
                <InputText
                  id="tenantName"
                  placeholder="Enter your tenant name"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-100"
                  aria-describedby="tenant-error"
                />
              </div>
            </div>

            <Button
              type="submit"
              iconPos="right"
              className="p-button-primary w-100 mt-2 d-flex gap-2 justify-content-center align-items-center"
            >
              <span>Continue</span> <i className="pi pi-arrow-right"></i>
            </Button>
          </form>
        </Card>
      </div>
    );

  return (
    <div className="view-routes">
      <ErrorBoundaryRoutes>
        <Route path="instructions" element={<Instructions />} />

        <Route
          index
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route path="login" element={<Login />} />

        <Route path="logout" element={<Logout />} />

        <Route path="account">
          <Route path="*" element={<Account />} />
          <Route path="register" element={<Register />} />
          <Route path="activate" element={<Activate />} />
          <Route path="reset">
            <Route path="request" element={<PasswordResetInit />} />
            <Route path="finish" element={<PasswordResetFinish />} />
          </Route>
        </Route>

        <Route path="admin/*" element={<Admin />} />

        <Route path="analytics/*" element={<AnalyticsRoutes />} />

        <Route path="inventory/*" element={<InventoryRoutes />} />

        <Route path="*" element={<EntitiesRoutes />} />

        <Route path="details/*" element={<BusinessDetailRoutes />} />

        <Route path="theme/*" element={<AppConfig />} />

        <Route path="*" element={<PageNotFound />} />
      </ErrorBoundaryRoutes>
    </div>
  );
};

export default AppRoutes;
