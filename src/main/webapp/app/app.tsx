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
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'app/shared/hooks/use-theme';
import { getTenantFromURL } from 'app/shared/util/tenant-utils';
import { runtimeConfig } from 'app/config/runtime-config';

const tenant = getTenantFromURL();
const baseHref = tenant ? `/${tenant}/` : '/';
export const App = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // dispatch(getSession());
    dispatch(setTenant({ tenant }));
  }, []);

  return (
    <BrowserRouter basename={baseHref}>
      <ThemeProvider>
        <LayoutProvider>
          <TooltipProvider delayDuration={1}>
            <APIProvider apiKey={runtimeConfig.GOOGLE_MAPS_API_KEY}>
              <Layout>
                <ErrorBoundary>
                  <VersionUpdateChecker />
                  <AppRoutes />
                </ErrorBoundary>
              </Layout>
            </APIProvider>
          </TooltipProvider>
        </LayoutProvider>
      </ThemeProvider>
    </BrowserRouter>

  );
};

export default App;
