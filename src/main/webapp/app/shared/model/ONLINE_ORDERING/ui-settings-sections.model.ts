import { IBranchDetails } from 'app/shared/model/business-detail.model';
import {
  AddonOptionsVisibility,
  IColorSetting,
  IFontSetting,
  ILanguages,
  IOnlineOrderingLogo,
  IScriptSnippet,
  ISocialProfiles,
  Language,
  VariantsUiLayout,
} from './ui-setting.model';
import { ILayouts } from './layouts/layouts.module';

export interface IBrandingSettings {
  applicationName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  socialProfiles?: ISocialProfiles | null;
}

export interface ICheckoutOrderingSettings {
  orderTaking?: 'TAKE_AWAY' | 'DELIVERY' | 'ALL';
  showDeliveryTips?: boolean;
  scheduleOrders?: boolean;
  orderConfirmation?: boolean;
  guestCheckout?: boolean;
  canOrder?: boolean;
  canOrderOutOfStock?: boolean;
  addonOptionsVisibility?: AddonOptionsVisibility;
}

export type ISeoBranchDetail = Pick<IBranchDetails, 'branchId' | 'hideRetailShop' | 'pages'>;

export interface IBranchSeoSettings {
  branchDetail?: ISeoBranchDetail[];
}

export interface IContentPagesSettings {
  privacyPolicy?: string;
  returnPolicy?: string;
  aboutUs?: string;
}

export interface ILocalizationSettings {
  languages?: ILanguages;
}

export interface IUiUxSettings {
  logo?: IOnlineOrderingLogo;
  colorSetting?: IColorSetting | null;
  fontSetting?: IFontSetting;
  retailItemsPerRow?: number;
  restaurantItemsPerRow?: number;
  hideBranchesSection?: boolean;
  variantsUiLayout?: VariantsUiLayout;
  hideItemDescription?: boolean;
  hideModalDescription?: boolean;
  currencySymbolPosition?: 'LEFT' | 'RIGHT' | 'HIDDEN';
  digitsAfterDecimal?: number;
  addonOptionsVisibility?: AddonOptionsVisibility;
}

export interface ILayoutsSettings {
  layouts?: ILayouts;
}

export interface ILandingPageSettings {
  usePageBuilder?: boolean;
  defaultPageId?: string;
  defaultPageSlug?: string;
}

export interface IStorefrontSettings {
  domain?: string;
  cookie?: string;
}

export interface IScriptsSettings {
  scriptSnippets?: IScriptSnippet[];
}

export interface ISeoContentSettings extends IBranchSeoSettings, IContentPagesSettings {}
export interface IThemeSettings extends IUiUxSettings, ILayoutsSettings {}
export interface IAdvancedSettings extends IStorefrontSettings, IScriptsSettings {}

export const brandingSettingsDefaultValue: Readonly<IBrandingSettings> = {
  socialProfiles: null,
};

export const checkoutOrderingSettingsDefaultValue: Readonly<ICheckoutOrderingSettings> = {
  orderTaking: 'TAKE_AWAY',
  showDeliveryTips: false,
  scheduleOrders: false,
  orderConfirmation: false,
  guestCheckout: false,
  canOrder: true,
  canOrderOutOfStock: true,
  addonOptionsVisibility: AddonOptionsVisibility.HIDDEN,
};

export const branchSeoSettingsDefaultValue: Readonly<IBranchSeoSettings> = {
  branchDetail: [],
};

export const contentPagesSettingsDefaultValue: Readonly<IContentPagesSettings> = {};

export const localizationSettingsDefaultValue: Readonly<ILocalizationSettings> = {
  languages: {
    defaultLanguage: Language.EN,
    enabledLanguages: [Language.EN],
  },
};

export const uiUxSettingsDefaultValue: Readonly<IUiUxSettings> = {
  colorSetting: null,
  variantsUiLayout: VariantsUiLayout.HORIZONTAL,
  currencySymbolPosition: 'LEFT',
  digitsAfterDecimal: 2,
  hideItemDescription: false,
  hideModalDescription: false,
  addonOptionsVisibility: AddonOptionsVisibility.HIDDEN,
};

export const layoutsSettingsDefaultValue: Readonly<ILayoutsSettings> = {
  layouts: {} as ILayouts,
};

export const landingPageSettingsDefaultValue: Readonly<ILandingPageSettings> = {
  usePageBuilder: false,
};

export const storefrontSettingsDefaultValue: Readonly<IStorefrontSettings> = {};

export const scriptsSettingsDefaultValue: Readonly<IScriptsSettings> = {
  scriptSnippets: [],
};

export const seoContentSettingsDefaultValue: Readonly<ISeoContentSettings> = {
  ...branchSeoSettingsDefaultValue,
  ...contentPagesSettingsDefaultValue,
};

export const themeSettingsDefaultValue: Readonly<IThemeSettings> = {
  ...uiUxSettingsDefaultValue,
  ...layoutsSettingsDefaultValue,
};

export const advancedSettingsDefaultValue: Readonly<IAdvancedSettings> = {
  ...storefrontSettingsDefaultValue,
  ...scriptsSettingsDefaultValue,
};
