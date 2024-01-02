import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Menu from './menu/index';
import Discount from './discount';
import Customer from './customer';
import RegularItem from './item/restaurant/regular-item';
import ComboItem from './item/restaurant/combo-item';
import Addon from './addon';
import AddonGroups from './addon-groups';
import PizzaGroup from './pizza-settings';


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
import PizzaSize from "app/entities/pizza-settings/pizza-size";
import PizzaTopping from "app/entities/pizza-settings/pizza-topping";
import PizzaPricingClass from "app/entities/pizza-settings/pizza-pricing-class";
import PizzaCrustRoutes from "app/entities/pizza-settings/pizza-crust-setting";
import PizzaCrustThicknessRoutes from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness-routes";
import PizzaCrustTypeRoutes from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type-routes";
import PredefinedPizza from "app/entities/pizza-settings/pizza-predefined/";
import FloorPlanTableRoutes from "app/entities/settings/floor-plans/tables";
import FloorPlanSettingsUpdate from "app/entities/settings/floor-plans/floor-plan-settings/floor-plan-settings-update";
import FloorPlanSettingsRoutes from "app/entities/settings/floor-plans/floor-plan-settings";
import FloorPlanRoutes from "app/entities/settings/floor-plans";
import PizzaItem from "app/entities/item/restaurant/pizza-item";
import PizzaToppingGroup from "app/entities/pizza-settings/pizza-topping-group";
import SimpleItem from "app/entities/item/retail/simple-item";
import RetailAttributes from "app/entities/item/retail/attributes";


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
        <Route path="addon/*" element={<Addon />} />
        <Route path="addon-groups/*" element={<AddonGroups />} />

        <Route path="category/*" element={<Term />} />
        <Route path="order/*" element={<Order />} />

        <Route path="tax/*" element={<Tax />} />
        <Route path="tax-profiles/*" element={<TaxesProfile />} />
        <Route path="accounting-groups/*" element={<AccountingGroups />} />

        <Route path="printer/*" element={<Printer />} />
        <Route path="printing-profiles/*" element={<PrintingProfiles />} />


        <Route path="production-center/*" element={<ProductionCenter />} />


        <Route path="void-reasons/*" element={<VoidReasons />} />


        <Route path="pizza-group/*" element={<PizzaGroup />} />

        <Route path="pizza-size/*" element={<PizzaSize />} />
        <Route path="pizza-topping/*" element={<PizzaTopping />} />
        <Route path="pizza-topping-group/*" element={<PizzaToppingGroup />} />
        <Route path="pizza-crust/*" element={<PizzaCrustRoutes />} />
        <Route path="pizza-crust-thickness/*" element={<PizzaCrustThicknessRoutes />} />
        <Route path="pizza-crust-type/*" element={<PizzaCrustTypeRoutes />} />
        <Route path="predefined-pizza/*" element={<PredefinedPizza />} />
        <Route path="pizza-pricing-class/*" element={<PizzaPricingClass />} />


        <Route path="floor-plan/table/*" element={<FloorPlanTableRoutes />} />
        <Route path="floor-plan/settings/*" element={<FloorPlanSettingsRoutes />} />
        <Route path="floor-plan/*" element={<FloorPlanRoutes />} />


        <Route path="restaurant/pizza/*" element={<PizzaItem />} />
        <Route path="restaurant/regular/*" element={<RegularItem />} />
        <Route path="restaurant/combo/*" element={<ComboItem />} />

        <Route path="retail/attributes/*" element={<RetailAttributes />} />
        <Route path="retail/simple/*" element={<SimpleItem />} />




        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
