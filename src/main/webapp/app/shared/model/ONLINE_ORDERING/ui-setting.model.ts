import { IAttachment } from "app/shared/model/attachment.model";
import { IBranchDetails } from "../business-detail.model";
import { ILayoutSettings, defaultLayoutValue } from "./layout-settings";
import { ILayouts } from "./layouts/layouts.module";
import { ISocialProfile } from "./social-profile";

export interface IUiSettings {
  address?: string,
  key?: "ONLINE_ORDERING_UI",
  currencySymbolPosition?: "LEFT" | "RIGHT",
  digitsAfterDecimal?: number,
  hideItemDescription?: boolean,
  hideModalDescription?: boolean,
  homePageSetting?: ILayoutSettings,
  domain?: string,
  itemPerRow?: number,
  orderTaking?: "TAKE_AWAY" | "DELIVERY" | "ALL",
  showDeliveryTips?: boolean,
  scheduleOrders?: boolean,
  logo?: IAttachment;
  cookie?: string;
  privacyPolicy?: string;
  email?: string;
  phoneNumber?: string;
  applicationName?: string;
  orderConfirmation?: boolean;
  branchDetail?: IBranchDetails[];
  colorSetting?: IColorSetting | null
  fontSetting?: IFontSetting
  canOrderOutOfStock?: boolean
  canOrder?: boolean
  layouts?: ILayouts
  socialProfiles?: ISocialProfiles | null
  retailItemsPerRow?: number
  restaurantItemsPerRow?: number
  hideBranchesSection?: boolean
}

export interface ISocialProfiles {
  FACEBOOK: ISocialProfile,
  INSTAGRAM: ISocialProfile,
  TWITTER: ISocialProfile,
  TIKTOK: ISocialProfile,
  YOUTUBE: ISocialProfile,
  LINKEDIN: ISocialProfile,
}

export type IColorSetting = {
  background: string
  foreground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
}

export type IFontSetting = {
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
}


export const currencySymbolPositionOptions: IUiSettings["currencySymbolPosition"][] = ["RIGHT", "LEFT"];
export const orderTakingOptions: IUiSettings["orderTaking"][] = ["TAKE_AWAY", "DELIVERY", "ALL"];


export const defaultValue: Readonly<IUiSettings> = {
  homePageSetting: defaultLayoutValue
};
