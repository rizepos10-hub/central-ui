import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Menu from './menu/index';
import Branch from './branch';
import Discount from './discount';
import Attachment from './attachment';
import Customer from './customer';
import Item from './item';
import Taxonomy from './taxonomy';
import Addon from './addon';
import Term from './term';
import Order from './order';
import Home from "app/shared/layout/home/home";
import BranchPosUserRoutes from "./branch-pos-user";
import BackOfficeUserRoutes from "./back-office-user";

/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        {/* prettier-ignore */}
        <Route index element={<Home />} />
        <Route path="menu/*" element={<Menu />} />
        <Route path="branch/*" element={<Branch />} />
        <Route path="back-office-user/*" element={<BackOfficeUserRoutes />} />
        <Route path="branch-pos-user/*" element={<BranchPosUserRoutes />} />

        <Route path="discount/*" element={<Discount />} />
        <Route path="attachment/*" element={<Attachment />} />
        <Route path="customer/*" element={<Customer />} />
        <Route path="item/*" element={<Item />} />
        <Route path="taxonomy/*" element={<Taxonomy />} />
        <Route path="addon/*" element={<Addon />} />
        <Route path="term/*" element={<Term />} />
        <Route path="order/*" element={<Order />} />


        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
