import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';

const ErrorBoundaryRoutes = React.lazy(() => import('app/shared/error/error-boundary-routes'));
const OnlineOrderingRoutes = React.lazy(() => import('app/entities/online-ordering/routes'));
const Menu = React.lazy(() => import('./menu/index'));
const Discount = React.lazy(() => import('./discount'));
const Customer = React.lazy(() => import('./customer'));
const LoyaltyCard = React.lazy(() => import('./loyalty-card'));
const RegularItem = React.lazy(() => import('app/entities/item/restaurant/regular-item'));
const ComboItem = React.lazy(() => import('app/entities/item/restaurant/combo-item'));
const Addon = React.lazy(() => import('./addon'));
const AddonGroups = React.lazy(() => import('./addon-groups'));
const PizzaGroup = React.lazy(() => import('./pizza-settings'));
const Term = React.lazy(() => import('./term'));
const Order = React.lazy(() => import('./order'));
const Tax = React.lazy(() => import('./settings/tax'));
const TaxesProfile = React.lazy(() => import('./settings/tax-profile'));
const ProfileGroups = React.lazy(() => import('./settings/profile-group'));
const VoidReasons = React.lazy(() => import('./settings/void-reason'));
const BranchPosUser = React.lazy(() => import('./branch-pos-user'));
const BackOfficeUser = React.lazy(() => import('./back-office-user'));
const SalesmenUser = React.lazy(() => import('./salesmen-user'));
const BookkeeperUser = React.lazy(() => import('./bookkeeper-user'));
const Printer = React.lazy(() => import('app/entities/settings/printing/printer'));
const PrintingProfiles = React.lazy(() => import('app/entities/settings/printing/printing-profiles'));
const ProductionCenter = React.lazy(() => import('app/entities/location/production-center'));
const PageNotFound = React.lazy(() => import("app/shared/error/page-not-found"));
const PizzaSize = React.lazy(() => import("app/entities/pizza-settings/pizza-size"));
const PizzaTopping = React.lazy(() => import("app/entities/pizza-settings/pizza-topping"));
const PizzaPricingClass = React.lazy(() => import("app/entities/pizza-settings/pizza-pricing-class"));
const PizzaCrust = React.lazy(() => import("app/entities/pizza-settings/pizza-crust-setting"));
const BasePizzaSettings = React.lazy(() => import("app/entities/pizza-settings/base-pizza"));
const PizzaCrustThickness = React.lazy(() => import("app/entities/pizza-settings/pizza-crust-setting/pizza-crust-thickness-routes"));
const PizzaCrustType = React.lazy(() => import("app/entities/pizza-settings/pizza-crust-setting/pizza-crust-type-routes"));
const PredefinedPizza = React.lazy(() => import("app/entities/pizza-settings/pizza-predefined/"));
const FloorPlanTable = React.lazy(() => import("app/entities/settings/floor-plans/tables"));
const FloorPlanSettings = React.lazy(() => import("app/entities/settings/floor-plans/floor-plan-settings"));
const FloorPlan = React.lazy(() => import("app/entities/settings/floor-plans"));
const PizzaItem = React.lazy(() => import("app/entities/item/restaurant/pizza-item"));
const PizzaToppingGroup = React.lazy(() => import("app/entities/pizza-settings/pizza-topping-group"));
const RetailAttributes = React.lazy(() => import("app/entities/item/retail/attributes"));
const Loyalty = React.lazy(() => import("app/entities/loyalty"));
const CurrencySettings = React.lazy(() => import("app/entities/settings/currency"));
const ZonesSettings = React.lazy(() => import("app/entities/settings/zones"));
const Tv = React.lazy(() => import("app/entities/settings/tv-config/tv"));
const TvDisplay = React.lazy(() => import("app/entities/settings/tv-config/tv-display"));
const Supplier = React.lazy(() => import("app/entities/inventory/supplier"));
const ItemMeasure = React.lazy(() => import("app/entities/item-measure"));
const MixAndMatchRule = React.lazy(() => import("app/entities/mix-and-match-rule"));
const Product = React.lazy(() => import("app/entities/item/retail/product"));
const Tag = React.lazy(() => import("app/entities/tag"));
const TagGroup = React.lazy(() => import("app/entities/tag-group"));
const BranchRegistry = React.lazy(() => import("app/entities/settings/branch-registry"));
const Brand = React.lazy(() => import("app/entities/brand"));
const Branches = React.lazy(() => import('./branches/branch'));
const ServiceCharge = React.lazy(() => import('./service-charges/index'));
const PricingPoint = React.lazy(() => import('./settings/pricing-point/index'));
const ImportFromOldSystem = React.lazy(() => import('./settings/import-from-old-system/import-from-old-system'));
const CatalogImportWizard = React.lazy(() => import('./settings/catalog-import'));
const CustomerImportWizard = React.lazy(() => import('./settings/customer-import'));
const CustomDefinition = React.lazy(() => import('./settings/custom-definitions/index'));
const GiftCardsRoutes = React.lazy(() => import('./item/virtual/gift-card'));
const CourseDefinitionRoutes = React.lazy(() => import('./settings/course-definition'));
const PosAuthorityGroupRoutes = React.lazy(() => import('./pos-authority-groups'));
const Barcode = React.lazy(() => import('./item/retail/barcode/barcode'));
const EndOfDay = React.lazy(() => import('./end-of-day'));
const PayoutType = React.lazy(() => import('./payout-type'));
const CashPayment = React.lazy(() => import('./cash-payment'));
const PaymentMethodSetting = React.lazy(() => import('./settings/payment-method-setting/index'));
const TookanSettings = React.lazy(() => import('./settings/tookan'));
const KioskSlidesSettings = React.lazy(() => import('./settings/kiosk-slides'));
const OnAccountSettings = React.lazy(() => import('./settings/on-account'));
const Flyers = React.lazy(() => import('./flyers'));

export default () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorBoundaryRoutes>
        <Route path="*" element={<PageNotFound />} />

        <Route path="menu/*" element={<Menu />} />
        <Route path="back-office-user/*" element={<BackOfficeUser />} />
        <Route path="branch-pos-user/*" element={<BranchPosUser />} />
        <Route path="salesmen-user/*" element={<SalesmenUser />} />
        <Route path="bookkeeper-user/*" element={<BookkeeperUser />} />
        <Route path="pos-authority-group/*" element={<PosAuthorityGroupRoutes />} />

        <Route path="branches/*" element={<Branches />} />
        <Route path="service-charge/*" element={<ServiceCharge />} />
        <Route path="pricing-point/*" element={<PricingPoint />} />
        <Route path="discount/*" element={<Discount />} />
        <Route path="customer/*" element={<Customer />} />
        <Route path="loyalty-cards/*" element={<LoyaltyCard />} />
        <Route path="loyalty/*" element={<Loyalty />} />
        <Route path="addon/*" element={<Addon />} />
        <Route path="addon-groups/*" element={<AddonGroups />} />

        <Route path="category/*" element={<Term />} />
        <Route path="order/*" element={<Order />} />

        <Route path="tax/*" element={<Tax />} />
        <Route path="tax-profiles/*" element={<TaxesProfile />} />
        <Route path="profile-groups/*" element={<ProfileGroups />} />

        <Route path="printer/*" element={<Printer />} />
        <Route path="printing-profiles/*" element={<PrintingProfiles />} />

        <Route path="production-center/*" element={<ProductionCenter />} />

        <Route path="branch-register/*" element={<BranchRegistry />} />

        <Route path="void-reasons/*" element={<VoidReasons />} />

        <Route path="pizza-group/*" element={<PizzaGroup />} />

        <Route path="pizza-size/*" element={<PizzaSize />} />
        <Route path="pizza-topping/*" element={<PizzaTopping />} />
        <Route path="pizza-topping-group/*" element={<PizzaToppingGroup />} />
        <Route path="pizza-crust/*" element={<PizzaCrust />} />
        <Route path="base-pizza/*" element={<BasePizzaSettings />} />
        <Route path="pizza-crust-thickness/*" element={<PizzaCrustThickness />} />
        <Route path="pizza-crust-type/*" element={<PizzaCrustType />} />
        <Route path="predefined-pizza/*" element={<PredefinedPizza />} />
        <Route path="pizza-pricing-class/*" element={<PizzaPricingClass />} />

        <Route path="course-definition*" element={<CourseDefinitionRoutes />} />
        <Route path="floor-plan/table/*" element={<FloorPlanTable />} />
        <Route path="floor-plan/settings/*" element={<FloorPlanSettings />} />
        <Route path="floor-plan/*" element={<FloorPlan />} />

        <Route path="restaurant/pizza/*" element={<PizzaItem />} />
        <Route path="restaurant/regular/*" element={<RegularItem />} />
        <Route path="restaurant/combo/*" element={<ComboItem />} />

        <Route path="retail/attributes/*" element={<RetailAttributes />} />
        <Route path="product/*" element={<Product />} />
        <Route path="barcodes/*" element={<Barcode />} />

        <Route path="item-measure/*" element={<ItemMeasure />} />
        <Route path="mix-and-match-rule/*" element={<MixAndMatchRule />} />
        <Route path="tag/*" element={<Tag />} />
        <Route path="tag-group/*" element={<TagGroup />} />

        <Route path="supplier/*" element={<Supplier />} />
        <Route path="brand/*" element={<Brand />} />

        <Route path="currencies/*" element={<CurrencySettings />} />
        <Route path="custom-definitions/*" element={<CustomDefinition />} />
        <Route path="zones/*" element={<ZonesSettings />} />
        <Route path="import-from-old-system/*" element={<ImportFromOldSystem />} />
        <Route path="catalog-import/*" element={<CatalogImportWizard />} />
        <Route path="customer-import/*" element={<CustomerImportWizard />} />

        <Route path="tv/*" element={<Tv />} />
        <Route path="tv-display/*" element={<TvDisplay />} />

        <Route path="online-ordering/*" element={<OnlineOrderingRoutes />} />

        <Route path="gift-cards/*" element={<GiftCardsRoutes />} />

        <Route path="end-of-day/*" element={<EndOfDay />} />
        <Route path="payout-type/*" element={<PayoutType />} />
        <Route path="cash-payment/*" element={<CashPayment />} />
        <Route path="payment-method-setting/*" element={<PaymentMethodSetting />} />
        <Route path="tookan-settings/*" element={<TookanSettings />} />
        <Route path="kiosk-slides-settings/*" element={<KioskSlidesSettings />} />
        <Route path="on-account-settings/*" element={<OnAccountSettings />} />
        <Route path="flyers/*" element={<Flyers />} />
      </ErrorBoundaryRoutes>
    </Suspense>
  );
};
