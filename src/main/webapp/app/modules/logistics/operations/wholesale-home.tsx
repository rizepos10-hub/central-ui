import React from 'react';
import { Navigate } from 'react-router-dom';

import { useAppSelector } from 'app/config/store';
import PrivateRoute, { hasAnyAuthority } from 'app/shared/auth/private-route';

import WholesaleOrders from '../wholesale-orders';
import { WHOLESALE_PAGE_ROLES } from '../wholesale-access';

/** `/logistics`: the order list for the ordering center, Factory Fulfillment for factory users. */
const WholesaleHome = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
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
