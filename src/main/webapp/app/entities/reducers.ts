import menu from 'app/entities/menu/menu.reducer';
import branch from 'app/entities/branch/branch.reducer';
import discount from 'app/entities/discount/discount.reducer';
import serviceCharge from 'app/entities/service-charges/service-charge.reducer';
import attachment from 'app/entities/attachment/attachment.reducer';
import customer from 'app/entities/customer/customer.reducer';
import loyaltycard from 'app/entities/loyalty-card/loyalty-card.reducer';
import notification from 'app/shared/components/notifications-center/notifications.reducer';
import wallet from 'app/entities/wallet/wallet.reducer';
import bill from 'app/entities/bill/bill.reducer';
import taxonomy from 'app/entities/taxonomy/taxonomy.reducer';
import addon from 'app/entities/addon/addon.reducer'
import addonGroups from 'app/entities/addon-groups/addon-groups.reducer';

import order from 'app/entities/order/order.reducer';
import delivery from 'app/entities/order/delivery.reducer';
import user from 'app/entities/back-office-user/user.reducer';
import PosBranchUser from 'app/entities/branch-pos-user/user.reducer';
import tax from 'app/entities/settings/tax/tax.reducer';
import profileGroup from 'app/entities/settings/profile-group/profile-group.reducer';
import voidReason from 'app/entities/settings/void-reason/void-reason.reducer';
import printer from 'app/entities/settings/printing/printer/printer.reducer';
import printingProfiles from 'app/entities/settings/printing/printing-profiles/printing-profile.reducer';
import productionCenter from 'app/entities/location/production-center/production-center.reducer';
import restaurantCategory from 'app/entities/term/restaurant-Item-category/item-restaurant-category.reducer';
import category from 'app/entities/term/Item-category/item-category.reducer';
import retailCategory from 'app/entities/term/retail-item-category/retail-item-category.reducer';
import menuCategory from 'app/entities/term/Menu-Category/menu-category.reducer';


import tagGroup from "app/entities/tag-group/tag-group.reducer"
import tag from "app/entities/tag/tag.reducer"
import brand from "app/entities/brand/brand.reducer";


import taxProfiles from 'app/entities/settings/tax-profile/tax-profile.reducer';
import businessDetail from 'app/entities/settings/business-details/business-detail.reducer';
import pizzaGroup from 'app/entities/pizza-settings/pizza-group.reducer';
import pizzaSize from 'app/entities/pizza-settings/pizza-size/pizza-size.reducer';
import pizzaPricingClass from 'app/entities/pizza-settings/pizza-pricing-class/pizza-pricing-class.reducer';
import pizzaCrustThickness from 'app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness.reducer';
import pizzaCrustType from 'app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type.reducer';
import pizzaTopping from 'app/entities/pizza-settings/pizza-topping/pizza-topping.reducer';
import predefinedPizza from 'app/entities/pizza-settings/pizza-predefined/pizza-predefined.reducer';
import courseDefinition from 'app/entities/settings/course-definition/course-definition.reducer';
import floorPlanTable from 'app/entities/settings/floor-plans/tables/table.reducer';
import floorPlanSettings from 'app/entities/settings/floor-plans/floor-plan-settings/floor-plan-settings.reducer';
import floorPlan from "app/entities/settings/floor-plans/floor-plan/floor-plan.reducer";
import toppingGroup from "app/entities/pizza-settings/pizza-topping-group/pizza-topping-group.reducer"
import pizzaItem from "app/entities/item/restaurant/pizza-item/pizza-item.reducer";
import regularItem from 'app/entities/item/restaurant/regular-item/regular-item.reducer';
import comboItem from 'app/entities/item/restaurant/combo-item/combo-item.reducer';
import simpleRetailItem from "app/entities/item/retail/simple-item/simple-item.reducer";
import variableRetailItem from "app/entities/item/retail/variable-item/variable-item.reducer";
import retailAttribute from "app/entities/item/retail/attributes/retail-attribute.reducer";
import retailAttributeValue from "app/entities/item/retail/attributes/retail-attribute-values.reducer";
import itemsForCombo from 'app/entities/item/restaurant/combo-item/items-for-combo.reducer';
import currencies from "app/entities/settings/currency/currencies.reducer"
import customDefinitions from "app/entities/settings/custom-definitions/custom-definitions.reducer"
import customDefinitionValues from "app/shared/components/custom-definition-values/custom-definition-values.reducer"
import currencySettings from "app/entities/settings/currency/currency-settings.reducer"
import restaurantItems from 'app/entities/item/restaurant/restaurant-item.reducer';
import allItems from 'app/entities/item/all-items.reducer';
import itemMeasure from 'app/entities/item-measure/item-measure.reducer'
import product from 'app/entities/item/retail/product/product.reducer';
import zones from "app/entities/settings/zones/zones.reducer"
import variant from "app/entities/variant/variant.reducer";

import tv from "app/entities/settings/tv-config/tv/tv.reducer"
import tvDisplay from "app/entities/settings/tv-config/tv-display/tv-display.reducer"

import shortcuts from 'app/shared/components/global-search/global-search.reducer';

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
import mixAndMatchRule from "app/entities/mix-and-match-rule/mix-and-match-rule.reducer"
import branchRegistry from "app/entities/settings/branch-registry/branch-registry.reducer";
import till from "app/entities/settings/branch-registry/till/till.reducer";
import itemDefinitions from 'app/entities/item-definitions/item-definitions.reducer';
import onlineOrderingReducers from "app/entities/online-ordering/reducer";
import GiftCardItem from './item/virtual/gift-card/giftcard-item.reducer';
import GiftCardCoupon from './coupon/gift-card/giftcard-coupon.reducer';

/* jhipster-needle-add-reducer-import - JHipster will add reducer here */

const entitiesReducers = {
  menu,
  branch,
  discount,
  serviceCharge,
  attachment,
  customer,
  loyaltycard,
  notification,
  wallet,
  bill,
  taxonomy,
  addon,
  addonGroups,
  order,
  delivery,
  user,
  PosBranchUser,
  tax,
  taxProfiles,
  profileGroup,
  businessDetail,
  voidReason,
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
  courseDefinition,
  floorPlanTable,
  floorPlanSettings,
  floorPlan,
  pizzaItem,
  restaurantCategory,
  category,
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
  product,
  itemsForCombo,
  allItems,
  loyalty,
  loyaltyExchange,
  currencies,
  customDefinitions,
  customDefinitionValues,
  currencySettings,
  tv,
  tvDisplay,
  shortcuts,
  supplier,
  salesLocation,
  warehouse,
  purchaseOrder,
  itemForStock,
  purchaseConfig,
  stockQuantity,
  transferRequest,
  supplierReturn,
  inventoryItem,
  itemMeasure,
  mixAndMatchRule,
  tagGroup,
  tag,
  branchRegistry,
  till,
  brand,
  zones,
  variant,
  GiftCardItem,
  GiftCardCoupon,
  ...onlineOrderingReducers


  /* jhipster-needle-add-reducer-combine - JHipster will add reducer here */
};

export default entitiesReducers;
