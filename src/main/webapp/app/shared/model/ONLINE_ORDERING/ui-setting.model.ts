import {IAttachment} from "app/shared/model/attachment.model";

export interface IUiSettings {
  key?: "ONLINE_ORDERING_UI",
  currencySymbolPosition?: "LEFT" | "RIGHT",
  digitsAfterDecimal?: number,
  hideItemDescription?: boolean,
  hideModalDescription?: boolean,
  itemPerRow?: number,
  orderTaking?: "TAKE_AWAY" | "DELIVERY",
  showDeliveryTips?: boolean,
  scheduleOrders?: boolean,
  logo?: IAttachment;
}

export const currencySymbolPositionOptions: IUiSettings["currencySymbolPosition"][] = ["RIGHT", "LEFT"];
export const orderTakingOptions: IUiSettings["orderTaking"][] = ["TAKE_AWAY", "DELIVERY"];


export const defaultValue: Readonly<IUiSettings> = {};
