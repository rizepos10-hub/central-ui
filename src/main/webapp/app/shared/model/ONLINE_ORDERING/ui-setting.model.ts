import { IAttachment } from "app/shared/model/attachment.model";
import { IBranchDetails } from "../business-detail.model";
import { ILayoutSettings, defaultLayoutValue } from "./layout-settings";

export interface IUiSettings {
  key?: "ONLINE_ORDERING_UI",
  currencySymbolPosition?: "LEFT" | "RIGHT",
  digitsAfterDecimal?: number,
  hideItemDescription?: boolean,
  hideModalDescription?: boolean,
  homePageSetting?: ILayoutSettings,
  domain?: string,
  itemPerRow?: number,
  orderTaking?: "TAKE_AWAY" | "DELIVERY",
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
  colorSetting?: ColorSetting | null
  fontSetting?: FontSetting
}

export type ColorSetting = {
  background: string
  foreground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
}

export type FontSetting = {
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
}


export const currencySymbolPositionOptions: IUiSettings["currencySymbolPosition"][] = ["RIGHT", "LEFT"];
export const orderTakingOptions: IUiSettings["orderTaking"][] = ["TAKE_AWAY", "DELIVERY"];


export const defaultValue: Readonly<IUiSettings> = {
  homePageSetting: defaultLayoutValue
};
