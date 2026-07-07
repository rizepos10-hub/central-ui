import React from 'react';
import { Navigate, Route } from 'react-router-dom';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import BrandingSettingsPage from "app/entities/online-ordering/settings/branding";
import CheckoutOrderingSettingsPage from "app/entities/online-ordering/settings/checkout-ordering";
import BranchSeoSettingsPage from "app/entities/online-ordering/settings/branch-seo";
import ContentPagesSettingsPage from "app/entities/online-ordering/settings/content-pages";
import LocalizationSettingsPage from "app/entities/online-ordering/settings/localization";
import UiUxSettingsPage from "app/entities/online-ordering/settings/ui-ux";
import StorefrontSettingsPage from "app/entities/online-ordering/settings/storefront-settings";
import ScriptsSettingsPage from "app/entities/online-ordering/settings/scripts";
import User from "app/entities/online-ordering/user";
import OnlineOrder from "app/entities/online-ordering/online-order/online-order";
import LayoutSettingsUpdate from './layout-settings/layout-settings';
import Layouts from './layouts/layouts';
import OnlineOrderingPages from './pages/pages';
import OnlineOrderingPageEditor from './pages/page-editor';


export default () => {
  return (
    <div>
      <ErrorBoundaryRoutes>
        <Route>
          <Route path={"settings"} element={<Navigate to="/online-ordering/branding" replace />} />
          <Route path={"branding"} element={<BrandingSettingsPage />} />
          <Route path={"checkout-ordering"} element={<CheckoutOrderingSettingsPage />} />
          <Route path={"branch-seo"} element={<BranchSeoSettingsPage />} />
          <Route path={"content-pages"} element={<ContentPagesSettingsPage />} />
          <Route path={"seo-content"} element={<Navigate to="/online-ordering/content-pages" replace />} />
          <Route path={"localization"} element={<LocalizationSettingsPage />} />
          <Route path={"ui-ux"} element={<UiUxSettingsPage />} />
          <Route path={"pick-a-layout"} element={<Layouts />} />
          <Route path={"theme"} element={<Navigate to="/online-ordering/pick-a-layout" replace />} />
          <Route path={"advanced"} element={<Navigate to="/online-ordering/storefront-settings" replace />} />
          <Route path={"storefront-settings"} element={<StorefrontSettingsPage />} />
          <Route path={"scripts"} element={<ScriptsSettingsPage />} />
          <Route path={"user"} element={<User />} />
          <Route path={"order"} element={<OnlineOrder />} />
          <Route path={"layout-settings"} element={<LayoutSettingsUpdate />} />
          <Route path={"pages"} element={<OnlineOrderingPages />} />
          <Route path={"pages/new"} element={<OnlineOrderingPageEditor />} />
          <Route path={"pages/:id/edit"} element={<OnlineOrderingPageEditor />} />
        </Route>
      </ErrorBoundaryRoutes>
  </div>
);
};
