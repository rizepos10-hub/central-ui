import React, { useState } from 'react';
import { Route, useLocation, useNavigate } from 'react-router-dom';
import Loadable from 'react-loadable';

import Login from 'app/modules/login/login';
import Register from 'app/modules/account/register/register';
import Activate from 'app/modules/account/activate/activate';
import PasswordResetInit from 'app/modules/account/password-reset/init/password-reset-init';
import PasswordResetFinish from 'app/modules/account/password-reset/finish/password-reset-finish';
import Logout from 'app/modules/login/logout';
import Home from 'app/shared/layout/home/home';
import EntitiesRoutes from 'app/entities/routes';
import AnalyticsRoutes from "app/modules/analytics/analyticsRoutes";
import PrivateRoute from 'app/shared/auth/private-route';
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
import { Label } from 'reactstrap';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

const loading = <div>loading ...</div>;

const Login = React.lazy(() => import('app/modules/login/login'));
const Register = React.lazy(() => import('app/modules/account/register/register'));
const Activate = React.lazy(() => import('app/modules/account/activate/activate'));
const PasswordResetInit = React.lazy(() => import('app/modules/account/password-reset/init/password-reset-init'));
const PasswordResetFinish = React.lazy(() => import('app/modules/account/password-reset/finish/password-reset-finish'));
const Logout = React.lazy(() => import('app/modules/login/logout'));
const Home = React.lazy(() => import('app/shared/layout/home/home'));
const EntitiesRoutes = React.lazy(() => import('app/entities/routes'));
const AnalyticsRoutes = React.lazy(() => import('app/modules/analytics/analyticsRoutes'));
const ErrorBoundaryRoutes = React.lazy(() => import('app/shared/error/error-boundary-routes'));
const PageNotFound = React.lazy(() => import('app/shared/error/page-not-found'));
const Instructions = React.lazy(() => import('app/modules/instructions/instructions'));
const BusinessDetailRoutes = React.lazy(() => import('app/entities/settings/business-details'));
const AppConfig = React.lazy(() => import('app/shared/sidebar/AppConfig'));
const InventoryRoutes = React.lazy(() => import('app/entities/inventory/routes'));
const Account = React.lazy(() => import(/* webpackChunkName: "account" */ 'app/modules/account'));
const Admin = React.lazy(() => import(/* webpackChunkName: "administration" */ 'app/modules/administration'));

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
  }

  if (!tenant) return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <Card className="shadow-lg border-0" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="text-center mb-4">
          <i className="pi pi-building text-primary" style={{ fontSize: "2rem" }}></i>
          <h2 className="mt-3 mb-1">Welcome To Rize POS</h2>
          {/* <h2 className="mt-3 mb-1">Tenant Access</h2> */}
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
                className={"w-100"}
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

          {/* <div className="text-center mt-3">
            <small className="text-muted">
              Need help?{" "}
              <a href="#" className="text-decoration-none">
                Contact your administrator
              </a>
            </small>
          </div> */}
        </form>
      </Card>
    </div>
  )

  return (
    <div className="view-routes">
      <ErrorBoundaryRoutes>
        <Route
          path="instructions"
          element={
            <PrivateRoute>
              <Instructions />
            </PrivateRoute>
          }
        />

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
          <Route
            path="*"
            element={
              <PrivateRoute >
                <Account />
              </PrivateRoute>
            }
          />
          <Route path="register" element={<Register />} />

          <Route path="activate" element={<Activate />} />

          <Route path="reset">
            <Route path="request" element={<PasswordResetInit />} />
            <Route path="finish" element={<PasswordResetFinish />} />
          </Route>
        </Route>

        <Route
          path="admin/*"
          element={
            <PrivateRoute >
              <Admin />
            </PrivateRoute>
          }
        />

        <Route
          path="analytics/*"
          element={
            <PrivateRoute >
              <AnalyticsRoutes />
            </PrivateRoute>
          }
        />

        <Route
          path="inventory/*"
          element={
            <InventoryRoutes />
          }
        />

        {/* <Route path="*" element={<EntitiesRoutes />} /> */}
        <Route
          path="*"
          element={
            <PrivateRoute >
              <EntitiesRoutes />
            </PrivateRoute>
          }
        />

        <Route
          path="details/*"
          element={
            <PrivateRoute >
              {<BusinessDetailRoutes />}
            </PrivateRoute>
          }
        />

        <Route
          path="theme/*"
          element={
            <PrivateRoute >
              {<AppConfig />}
            </PrivateRoute>
          }
        />

        <Route path="*" element={<PageNotFound />} />
      </ErrorBoundaryRoutes>
    </div>
  );
};

export default AppRoutes;
