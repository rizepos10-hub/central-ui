import 'react-toastify/dist/ReactToastify.css';
import './app.scss';
import 'app/config/dayjs.ts';

import React, { useEffect } from 'react';
import { Card } from 'reactstrap';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getSession } from 'app/shared/reducers/authentication';
import { getProfile } from 'app/shared/reducers/application-profile';
import { setLocale } from 'app/shared/reducers/locale';
import Header from 'app/shared/layout/header/header';
import Footer from 'app/shared/layout/footer/footer';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import ErrorBoundary from 'app/shared/error/error-boundary';
import { AUTHORITIES } from 'app/config/constants';
import AppRoutes from 'app/routes';
import TenantContext from 'app/shared/tenant/TenantContext';
import Sidebar from "app/shared/sidebar/sidebar";

// const baseHref = document.querySelector('base').getAttribute('href').replace(/\/$/, '');

function getTenantFromURL() {
  // const subdomain = window.location.hostname.split('.')[0]; // for subdomain
  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/').filter(segment => segment !== '');

  // The first non-empty path segment will be considered as the base path (tenant)
  if (pathSegments.length > 0) {
    return pathSegments[0];
  }
}

const tenant = getTenantFromURL();
const baseHref = `/${tenant}/`;
export const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getSession());
    dispatch(getProfile());
  }, []);

  const currentLocale = useAppSelector(state => state.locale.currentLocale);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);
  const isAdmin = useAppSelector(state => hasAnyAuthority(state.authentication.account.authorities, [AUTHORITIES.ADMIN]));
  const ribbonEnv = useAppSelector(state => state.applicationProfile.ribbonEnv);
  const isInProduction = useAppSelector(state => state.applicationProfile.inProduction);
  const isOpenAPIEnabled = useAppSelector(state => state.applicationProfile.isOpenAPIEnabled);

  const paddingTop = '60px';
  return (
    <TenantContext.Provider value={tenant}>
      <BrowserRouter basename={baseHref}>
        <div className="app-container" style={{ paddingTop }}>
          <ToastContainer position={toast.POSITION.TOP_LEFT} className="toastify-container" toastClassName="toastify-toast" />
          <ErrorBoundary>
            <Header
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              currentLocale={currentLocale}
              ribbonEnv={ribbonEnv}
              isInProduction={isInProduction}
              isOpenAPIEnabled={isOpenAPIEnabled}
            />
          </ErrorBoundary>
          <div className="container-fluid view-container row" id="app-view-container">
            <Sidebar isAuthenticated={isAuthenticated} />
            <Card className={`jh-card ${isAuthenticated ? "col-10" : "col-12"} `}>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </Card>
            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </TenantContext.Provider>
  );
};

export default App;
