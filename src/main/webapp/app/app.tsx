import 'react-toastify/dist/ReactToastify.css';
import './app.scss';
import 'app/config/dayjs.ts';
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getSession } from 'app/shared/reducers/authentication';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import ErrorBoundary from 'app/shared/error/error-boundary';
import { AUTHORITIES } from 'app/config/constants';
import AppRoutes from 'app/routes';
import { Layout } from 'app/shared/layout/Layout';
import { LayoutProvider } from 'app/shared/sidebar/context/layoutcontext';
import { setTenant } from 'app/shared/tenant/TenantContext';
import VersionUpdateChecker from "app/version/version-checker";
import { APIProvider } from '@vis.gl/react-google-maps';

// const baseHref = document.querySelector('base').getAttribute('href').replace(/\/$/, '');

export function getTenantFromURL() {
  // const subdomain = window.location.hostname.split('.')[0]; // for subdomain
  const pathname = window.location.pathname;
  const pathSegments = pathname.split('/').filter(segment => segment !== '');

  // The first non-empty path segment will be considered as the base path (tenant)
  if (pathSegments.length > 0) {
    return pathSegments[0];
  }
}

const tenant = getTenantFromURL();
const baseHref = tenant ? `/${tenant}/` : '/';
export const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getSession());
    dispatch(setTenant({ tenant }));
  }, []);

  console.log(tenant)

  return (
    <BrowserRouter basename={baseHref}>
      <LayoutProvider>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Layout>
            <ErrorBoundary>
              <VersionUpdateChecker />
              <AppRoutes />
            </ErrorBoundary>
          </Layout>
        </APIProvider>
      </LayoutProvider>
    </BrowserRouter>

  );
};

export default App;
