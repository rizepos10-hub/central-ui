import uiSettings from "app/entities/online-ordering/settings/settings.reducer"
import brandingSettings from "app/entities/online-ordering/settings/branding.reducer"
import checkoutOrderingSettings from "app/entities/online-ordering/settings/checkout-ordering.reducer"
import branchSeoSettings from "app/entities/online-ordering/settings/branch-seo.reducer"
import contentPagesSettings from "app/entities/online-ordering/settings/content-pages.reducer"
import seoContentSettings from "app/entities/online-ordering/settings/seo-content.reducer"
import localizationSettings from "app/entities/online-ordering/settings/localization.reducer"
import uiUxSettings from "app/entities/online-ordering/settings/ui-ux.reducer"
import themeSettings from "app/entities/online-ordering/settings/theme.reducer"
import layoutsSettings from "app/entities/online-ordering/settings/layouts-settings.reducer"
import landingPageSettings from "app/entities/online-ordering/settings/landing-page-settings.reducer"
import advancedSettings from "app/entities/online-ordering/settings/advanced.reducer"
import storefrontSettings from "app/entities/online-ordering/settings/storefront-settings.reducer"
import scriptsSettings from "app/entities/online-ordering/settings/scripts.reducer"
import onlineOrderingPage from "app/entities/online-ordering/pages/pages.reducer"
import onlineOrderingUser from "app/entities/online-ordering/user/user.reducer"


const onlineOrderingReducers = {
  uiSettings,
  brandingSettings,
  checkoutOrderingSettings,
  branchSeoSettings,
  contentPagesSettings,
  seoContentSettings,
  localizationSettings,
  uiUxSettings,
  themeSettings,
  layoutsSettings,
  landingPageSettings,
  advancedSettings,
  storefrontSettings,
  scriptsSettings,
  onlineOrderingPage,
  onlineOrderingUser,

};

export default onlineOrderingReducers;
