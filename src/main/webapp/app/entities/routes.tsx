import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import {Spinner} from "reactstrap";

// Import lazy-loaded components
const Menu = lazy(() => import('./menu/index'));
const BackOfficeUserRoutes = lazy(() => import('./back-office-user'));
const BranchPosUserRoutes = lazy(() => import('./branch-pos-user'));
const Discount = lazy(() => import('./discount'));
const Customer = lazy(() => import('./customer'));
const Item = lazy(() => import('./item'));
const Addon = lazy(() => import('./addon'));
const AddonGroups = lazy(() => import('./addon-groups'));
const Term = lazy(() => import('./term'));
const Order = lazy(() => import('./order'));
const Tax = lazy(() => import('./settings/taxes'));
const TaxesProfile = lazy(() => import('./settings/tax-profiles'));
const AccountingGroups = lazy(() => import('./settings/accounting-groups'));
const Printer = lazy(() => import('./settings/printing/printer'));
const PrintingProfiles = lazy(() => import('./settings/printing/printing-profiles'));
const ProductionCenter = lazy(() => import('./location/production-center'));
const PageNotFound = lazy(() => import('app/shared/error/page-not-found'));
const VoidReasons = lazy(() => import('./settings/void-reasons'));
const PizzaGroup = lazy(() => import('./pizza-group'));

/* jhipster-needle-add-route-import - JHipster will add routes here */

const LazyLoadedRoutes = () => {
  return (
    <Suspense fallback={<Spinner />}>
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
    </Suspense>
  );
};

export default LazyLoadedRoutes;
