import React, { useState, Suspense } from 'react';
import { Route, useLocation } from 'react-router-dom';
import { getTenantFromURL } from './app';
import { Card } from 'primereact/card';
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
  };

  if (!tenant) {
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
  }

  return (
    <Suspense fallback={loading}>
      <div className="view-routes">
        <ErrorBoundaryRoutes>
          <Route path="instructions" element={<Instructions />} />
          <Route index element={<Home />} />
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
    </Suspense>
  );
};

export default AppRoutes;
