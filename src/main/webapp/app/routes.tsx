import React, { useState } from 'react';
import { Route, useLocation, useNavigate } from 'react-router-dom';
import Loadable from 'react-loadable';
import { Building, ArrowRight } from 'lucide-react';

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
import LogisticsRoutes from "app/modules/logistics/logisticsRoutes";
import { getTenantFromURL } from 'app/shared/util/tenant-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const loading = <div>loading ...</div>;

const Account = Loadable({
  loader: () => import(/* webpackChunkName: "account" */ 'app/modules/account'),
  loading: () => loading,
});

const Admin = Loadable({
  loader: () => import(/* webpackChunkName: "administration" */ 'app/modules/administration'),
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
  }

  if (!tenant) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Building className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome To Rize POS</h2>
            <p className="text-sm text-muted-foreground">Account Access - Enter your account name to continue</p>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName" className="text-sm font-semibold">
                Account Name
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  id="tenantName"
                  placeholder="Enter your account name"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="pl-10"
                  aria-describedby="tenant-error"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              className="w-full"
            >
              <span>Continue</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
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
          path="logistics/*"
          element={
            <PrivateRoute>
              <LogisticsRoutes />
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
