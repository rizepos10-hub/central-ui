import React, {lazy, Suspense} from 'react';
import { Route, useLocation } from 'react-router-dom';
import Loadable from 'react-loadable';

import Login from 'app/modules/login/login';
import Register from 'app/modules/account/register/register';
import Activate from 'app/modules/account/activate/activate';
import PasswordResetInit from 'app/modules/account/password-reset/init/password-reset-init';
import PasswordResetFinish from 'app/modules/account/password-reset/finish/password-reset-finish';
import Logout from 'app/modules/login/logout';
// import Home from 'app/shared/layout/home/home';
// import EntitiesRoutes from 'app/entities/routes';
// import AnalyticsRoutes from "app/modules/analytics/analyticsRoutes";
// import BusinessDetailRoutes from "app/entities/settings/business-details";
import PrivateRoute from 'app/shared/auth/private-route';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PageNotFound from 'app/shared/error/page-not-found';
import { AUTHORITIES } from 'app/config/constants';
import { sendActivity } from 'app/config/websocket-middleware';
import Welcome from "app/modules/login/welcome";
import {useAppSelector} from "app/config/store";
import {Spinner} from "reactstrap";

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
  React.useEffect(() => {
    sendActivity(location.pathname);
  }, [location]);


  const EntitiesRoutes = lazy(() => import('app/entities/routes'))
  const AnalyticsRoutes = lazy(() => import('app/modules/analytics/analyticsRoutes'))
  const BusinessDetailRoutes = lazy(() => import('app/entities/settings/business-details'))
  const Home = lazy(() => import('app/shared/layout/home/home'))



  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  return (
    <div className="view-routes">
      <Suspense fallback={<Spinner />}>

      <ErrorBoundaryRoutes>

        <Route
          path="instructions"
          element={
            <PrivateRoute>
              <Welcome />
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
              <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.USER]}>
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
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN]}>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="analytics/*"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.USER]}>
              <AnalyticsRoutes />
            </PrivateRoute>
          }
        />
        <Route
          path="*"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.USER]}>
              <EntitiesRoutes />
            </PrivateRoute>
          }
        />


        <Route
          path="details/*"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.USER, AUTHORITIES.BUSINESS_SETTING]}>
              {<BusinessDetailRoutes />}
            </PrivateRoute>
          }
        />
        {/* <Route */}
        {/*   path="settings/*" */}
        {/*   element={ */}
        {/*     <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.USER]}> */}
        {/*      <SettingRoutes /> */}
        {/*     </PrivateRoute> */}
        {/*   } */}
        {/* /> */}



        <Route path="*" element={<PageNotFound />} />
      </ErrorBoundaryRoutes>
      </Suspense>

    </div>
  );
};

export default AppRoutes;
