import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Menu from './menu/index';
import Discount from './discount';
import Customer from './customer';
import Item from './item';
import Addon from './addon';
import AddonGroups from './addon-groups';
import PizzaGroup from './pizza-group';


import Term from './term';
import Order from './order';
import Tax from './settings/taxes';
import TaxesProfile from './settings/tax-profiles';
import AccountingGroups from './settings/accounting-groups';
import VoidReasons from './settings/void-reasons';

import Home from 'app/shared/layout/home/home';
import BranchPosUserRoutes from './branch-pos-user';
import BackOfficeUserRoutes from './back-office-user';
import BusinessDetailRoutes from 'src/main/webapp/app/entities/settings/business-details';
import Printer from 'app/entities/settings/printing/printer';
import PrintingProfiles from 'app/entities/settings/printing/printing-profiles';

import ProductionCenter from 'app/entities/location/production-center';
import PageNotFound from "app/shared/error/page-not-found";


/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        {/* prettier-ignore */}
        <Route path="*" element={<PageNotFound />} />

        <Route path="menu/*" element={<Menu />} />
        <Route path="back-office-user/*" element={<BackOfficeUserRoutes />} />
        <Route path="branch-pos-user/*" element={<BranchPosUserRoutes />} />

        <Route path="discount/*" element={<Discount />} />
        <Route path="customer/*" element={<Customer />} />
        <Route path="item/*" element={<Item />} />
        <Route path="addon/*" element={<Addon />} />
        <Route path="addon-groups/*" element={<AddonGroups />} />

        <Route path="term/*" element={<Term />} />
        <Route path="order/*" element={<Order />} />

        <Route path="tax/*" element={<Tax />} />
        <Route path="tax-profiles/*" element={<TaxesProfile />} />
        <Route path="accounting-groups/*" element={<AccountingGroups />} />

        <Route path="printer/*" element={<Printer />} />
        <Route path="printing-profiles/*" element={<PrintingProfiles />} />


        <Route path="production-center/*" element={<ProductionCenter />} />


        <Route path="void-reasons/*" element={<VoidReasons />} />


        <Route path="pizza-group/*" element={<PizzaGroup />} />



        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
