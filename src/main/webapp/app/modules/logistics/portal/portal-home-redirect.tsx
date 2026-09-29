import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAppSelector } from 'app/config/store';

import { isPortalCustomer } from './portal.model';

/** Portal customers land on their ordering page instead of the back-office home. */
export const PortalHomeRedirect = ({ children }: { children: React.ReactNode }) => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities);
  return isPortalCustomer(authorities) ? <Navigate to="/portal" replace /> : <>{children}</>;
};

export default PortalHomeRedirect;
