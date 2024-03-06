import {IAttachment} from "app/shared/model/attachment.model";
import {IStockOrderedItem} from "app/shared/model/STOCK/order-Item.model";
import {IPurchaseConfig} from "app/shared/model/STOCK/purchase-config.model";

export interface IInventoryItem {
  id?: string;
  name?: string;
  desc?: string;
  attachments?: IAttachment[];
  variants?: IInventoryItemVariant[];
  attributes?: any;
}

export interface IInventoryItemVariant {
  id?: string;
  name?: string;
  sku?: string;
  price?: number;
  attributeValues?: any;
  attachments?: IAttachment[];
  itemPurchasingConfig?: IPurchaseConfig;

}

export const defaultValue: Readonly<IStockOrderedItem> = {};
