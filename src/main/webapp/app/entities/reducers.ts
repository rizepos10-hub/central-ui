import menu from 'app/entities/menu/menu.reducer';
import branch from 'app/entities/branch/branch.reducer';
import discount from 'app/entities/discount/discount.reducer';
import attachment from 'app/entities/attachment/attachment.reducer';
import customer from 'app/entities/customer/customer.reducer';
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
import restaurantCategory from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import retailCategory from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import menuCategory from 'app/entities/term/Menu-Category/menu-category.reducer';




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
import toppingGroup from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer"
import pizzaItem from "app/entities/item/restaurant/pizza-item/pizza-item.reducer";
import regularItem from 'app/entities/item/restaurant/regular-item/item.reducer';
import comboItem from 'app/entities/item/restaurant/combo-item/combo-item.reducer';
import simpleRetailItem from "app/entities/item/retail/simple-item/simple-item.reducer";
import variableRetailItem from "app/entities/item/retail/variable-item/variable-item.reducer";
import retailAttribute from "app/entities/item/retail/attributes/retail-attribute.reducer";
import retailAttributeValue from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import retailItems from "app/entities/item/retail/retail-items.reducer";
import itemsForCombo from 'app/entities/item/restaurant/combo-item-prev/items-for-combo.reducer';
import currencies from "app/entities/settings/currency/currencies.reducer"
import currencySettings from "app/entities/settings/currency/currency-settings.reducer"
import restaurantItems from 'app/entities/item/restaurant/restaurant-item.reducer';
import allItems from 'app/entities/item/all-items.reducer';

import tv from "app/entities/settings/tv-config/tv/tv.reducer"
import tvDisplay from "app/entities/settings/tv-config/tv-display/tv-display.reducer"

import loyalty from "app/entities/loyalty/loyalty-records.reducer";
import loyaltyExchange from "app/entities/loyalty/loyalty-exchange.reducer";
import supplier from "app/entities/inventory/supplier/supplier.reducer"
import salesLocation from "app/entities/inventory/sales-location/sales-location.reducer"
import warehouse from "app/entities/inventory/warehouse/warehouse.reducer"
import purchaseOrder from "app/entities/inventory/purchase-order/purchase-order.reducer"
import itemForStock from "app/entities/inventory/stock-config/items-stock-config.reducer"
import purchaseConfig from "app/entities/inventory/stock-config/purchase-config.reducer"
import inventoryItem from "app/entities/inventory/stock-config/inventory-items.reducer"
import stockQuantity from "app/entities/inventory/stock-config/stock-quantity.reducer"
import transferRequest from "app/entities/inventory/transfer-request/transfer-request.reducer"
import supplierReturn from "app/entities/inventory/supplier-return/supplier-return.reducer"
import itemDefinitions from 'app/entities/item-definitions/item-definitions.reducer';

/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  menu,
  branch,
  discount,
  attachment,
  customer,
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
  pizzaItem,
  restaurantCategory,
  retailCategory,
  menuCategory,
  toppingGroup,
  regularItem,
  comboItem,
  simpleRetailItem,
  variableRetailItem,
  retailAttribute,
  retailAttributeValue,
  restaurantItems,
  retailItems,
  itemsForCombo,
  allItems,
  loyalty,
  loyaltyExchange,
  currencies,
  currencySettings,
  tv,
  tvDisplay,
  supplier,
  salesLocation,
  warehouse,
  purchaseOrder,
  itemForStock,
  purchaseConfig,
  stockQuantity,
  transferRequest,
  supplierReturn,
  inventoryItem


  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
};

export default entitiesReducers;
