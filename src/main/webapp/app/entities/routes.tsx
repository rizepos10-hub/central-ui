import React from 'react';
import { Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import OnlineOrderingRoutes from 'app/entities/online-ordering/routes'

import Menu from './menu/index';
import Discount from './discount';
import Customer from './customer';
import RegularItem from 'app/entities/item/restaurant/regular-item';
import ComboItem from 'app/entities/item/restaurant/combo-item';
import Addon from './addon';
import AddonGroups from './addon-groups';
import PizzaGroup from './pizza-settings';

import Term from './term';
import Order from './order';
import Tax from './settings/tax';
import TaxesProfile from './settings/tax-profile';
import AccountingGroups from './settings/accounting-group';
import VoidReasons from './settings/void-reasons';

import BranchPosUser from './branch-pos-user';
import BackOfficeUser from './back-office-user';
import Printer from 'app/entities/settings/printing/printer';
import PrintingProfiles from 'app/entities/settings/printing/printing-profiles';

import ProductionCenter from 'app/entities/location/production-center';
import PageNotFound from "app/shared/error/page-not-found";
import PizzaSize from "app/entities/pizza-settings/pizza-size";
import PizzaTopping from "app/entities/pizza-settings/pizza-topping";
import PizzaPricingClass from "app/entities/pizza-settings/pizza-pricing-class";
import PizzaCrust from "app/entities/pizza-settings/pizza-crust-setting";
import PizzaCrustThickness from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness-routes";
import PizzaCrustType from "app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type-routes";
import PredefinedPizza from "app/entities/pizza-settings/pizza-predefined/";
import FloorPlanTable from "app/entities/settings/floor-plans/tables";
import FloorPlanSettings from "app/entities/settings/floor-plans/floor-plan-settings";
import FloorPlan from "app/entities/settings/floor-plans";
import PizzaItem from "app/entities/item/restaurant/pizza-item";
import PizzaToppingGroup from "app/entities/pizza-settings/pizza-topping-group";
import SimpleItem from "app/entities/item/retail/simple-item";
import RetailAttributes from "app/entities/item/retail/attributes";
import VariableItem from "app/entities/item/retail/variable-item";
import Loyalty from "app/entities/loyalty";

import CurrencySettings from "app/entities/settings/currency";
import Tv from "app/entities/settings/tv-config/tv";
import TvDisplay from "app/entities/settings/tv-config/tv-display";

import Supplier from "app/entities/inventory/supplier"
import SalesLocation from "app/entities/inventory/sales-location"
import Warehouse from "app/entities/inventory/warehouse"
import PurchaseOrder from "app/entities/inventory/purchase-order";
import StockConfig from "app/entities/inventory/stock-config";
import TransferRequest from "app/entities/inventory/transfer-request";
import SupplierReturn from "app/entities/inventory/supplier-return";
import ItemMeasure from "app/entities/item-measure";
import MixAndMatchRule from "app/entities/mix-and-match-rule"

/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        {/* prettier-ignore */}
        <Route path="*" element={<PageNotFound />} />

        <Route path="menu/*" element={<Menu />} />
        <Route path="back-office-user/*" element={<BackOfficeUser />} />
        <Route path="branch-pos-user/*" element={<BranchPosUser />} />

        <Route path="discount/*" element={<Discount />} />
        <Route path="customer/*" element={<Customer />} />
        <Route path="loyalty/*" element={<Loyalty />}/>
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
        <Route path="pizza-crust/*" element={<PizzaCrust />} />
        <Route path="pizza-crust-thickness/*" element={<PizzaCrustThickness />} />
        <Route path="pizza-crust-type/*" element={<PizzaCrustType />} />
        <Route path="predefined-pizza/*" element={<PredefinedPizza />} />
        <Route path="pizza-pricing-class/*" element={<PizzaPricingClass />} />


        <Route path="floor-plan/table/*" element={<FloorPlanTable />} />
        <Route path="floor-plan/settings/*" element={<FloorPlanSettings />} />
        <Route path="floor-plan/*" element={<FloorPlan />} />


        <Route path="restaurant/pizza/*" element={<PizzaItem />} />
        <Route path="restaurant/regular/*" element={<RegularItem />} />
        <Route path="restaurant/combo/*" element={<ComboItem />} />

        <Route path="retail/attributes/*" element={<RetailAttributes />} />
        <Route path="retail/simple/*" element={<SimpleItem />} />
        <Route path="retail/variable/*" element={<VariableItem />} />

        <Route path="item-measure/*" element={<ItemMeasure />} />
        <Route path="mix-and-match-rule/*" element={<MixAndMatchRule />} />


        <Route path="currencies/*" element={<CurrencySettings />} />

        <Route path="tv/*" element={<Tv />} />
        <Route path="tv-display/*" element={<TvDisplay />} />


        <Route path="inventory/supplier/*" element={<Supplier />} />
        <Route path="inventory/sales-location/*" element={<SalesLocation />} />
        <Route path="inventory/warehouse/*" element={<Warehouse />} />
        <Route path="inventory/purchase-order/*" element={<PurchaseOrder />} />
        <Route path="inventory/stock/*" element={<StockConfig />} />
        <Route path="inventory/transfer-request/*" element={<TransferRequest />} />
        <Route path="inventory/supplier-return/*" element={<SupplierReturn />} />

        <Route path="online-ordering/*" element={<OnlineOrderingRoutes />} />


        {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      </ErrorBoundaryRoutes>
    </div>
  );
};
