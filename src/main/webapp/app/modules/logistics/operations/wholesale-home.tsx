import React from 'react';
import { Navigate } from 'react-router-dom';

import { AUTHORITIES } from 'app/config/constants';
import { useAppSelector } from 'app/config/store';
import PrivateRoute, { hasAnyAuthority } from 'app/shared/auth/private-route';

import WholesaleOrders from '../wholesale-orders';
import { WHOLESALE_PAGE_ROLES } from '../wholesale-access';
import { PortalOrdersPanel } from '../portal/portal-orders-panel';

/** `/logistics`: the Dashboard for those who can see it, else the order list, else Factory Fulfillment for factory users. */
const WholesaleHome = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  if (hasAnyAuthority(authorities, WHOLESALE_PAGE_ROLES.dashboard)) {
    return <Navigate to="dashboard" replace />;
  }
  if (!hasAnyAuthority(authorities, WHOLESALE_PAGE_ROLES.wholesaleOrders) && hasAnyAuthority(authorities, WHOLESALE_PAGE_ROLES.factoryFulfillment)) {
    return <Navigate to="factory-fulfillment" replace />;
  }
  return (
    <PrivateRoute hasAnyAuthorities={WHOLESALE_PAGE_ROLES.wholesaleOrders}>
      {hasAnyAuthority(authorities, [AUTHORITIES.WHOLESALE_SALESMAN]) && (
        <div className="px-4 pt-4">
          <PortalOrdersPanel />
        </div>
      )}
      <WholesaleOrders />
    </PrivateRoute>
  );
};

export default WholesaleHome;
