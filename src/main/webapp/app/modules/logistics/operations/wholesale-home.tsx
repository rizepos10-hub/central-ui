import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAppSelector } from 'app/config/store';
import PrivateRoute, { hasAnyAuthority } from 'app/shared/auth/private-route';

import WholesaleOrders from '../wholesale-orders';
import { WHOLESALE_PAGE_ROLES } from '../wholesale-access';

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
      <WholesaleOrders />
    </PrivateRoute>
  );
};

export default WholesaleHome;
