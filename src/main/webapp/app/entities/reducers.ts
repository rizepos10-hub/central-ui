import menu from 'app/entities/menu/menu.reducer';
import branch from 'app/entities/branch/branch.reducer';
import discount from 'app/entities/discount/discount.reducer';
import attachment from 'app/entities/attachment/attachment.reducer';
import customer from 'app/entities/customer/customer.reducer';
import item from 'app/entities/item/item.reducer';
import taxonomy from 'app/entities/taxonomy/taxonomy.reducer';
import addon from 'app/entities/addon/addon.reducer'
import addonGroups from 'app/entities/addon-groups/addon-groups.reducer';

import term from 'app/entities/term/term.reducer';
import order from 'app/entities/order/order.reducer';
import user from 'app/entities/back-office-user/user.reducer';
import PosBranchUser from 'app/entities/branch-pos-user/user.reducer';
import tax from 'app/entities/settings/taxes/tax.reducer';
import accountingGroups from 'app/entities/settings/accounting-groups/accounting-groups.reducer';
import voidReasons from 'app/entities/settings/void-reasons/void-reasons.reducer';
import printer from 'app/entities/settings/printing/printer/printer.reducer';
import printingProfiles from 'app/entities/settings/printing/printing-profiles/printing-profile.reducer';
import productionCenter from 'app/entities/location/production-center/production-center.reducer';


import taxProfiles from 'app/entities/settings/tax-profiles/tax-profile.reducer';
import businessDetail from 'app/entities/settings/business-details/business-detail.reducer';
import pizzaGroup from 'app/entities/pizza-settings/pizza-group.reducer';
import pizzaSize from 'app/entities/pizza-settings/pizza-size/pizza-size.reducer';
import pizzaPricingClass from 'app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer';
import pizzaCrustThickness from 'app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness.reducer';
import pizzaCrustType from 'app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer';
import pizzaTopping from 'app/entities/pizza-settings/pizza-topping/pizza-topping.reducer';
import predefinedPizza from 'app/entities/pizza-settings/pizza-predefined/pizza-predefined.reducer';
import floorPlanTable from 'app/entities/settings/floor-plans/tables/table.reducer';
import floorPlanSettings from 'app/entities/settings/floor-plans/floor-plan-settings/floor-plan-settings.reducer';
import floorPlan from "app/entities/settings/floor-plans/floor-plan/floor-plan.reducer";

import pizzaItem from "app/entities/pizza-item/pizza-item.reducer";

import itemDefinitions from 'app/entities/item-definitions/item-definitions.reducer';

/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  menu,
  branch,
  discount,
  attachment,
  customer,
  item,
  taxonomy,
  addon,
  addonGroups,
  term,
  order,
  user,
  PosBranchUser,
  tax,
  taxProfiles,
  accountingGroups,
  businessDetail,
  voidReasons,
  printer,
  printingProfiles,
  productionCenter,
  pizzaGroup,
  pizzaSize,
  pizzaTopping,
  pizzaCrustThickness,
  pizzaCrustType,
  pizzaPricingClass,
  predefinedPizza,
  floorPlanTable,
  floorPlanSettings,
  floorPlan,
  pizzaItem

  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
};

export default entitiesReducers;
