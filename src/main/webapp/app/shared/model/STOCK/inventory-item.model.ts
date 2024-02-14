import {IAttachment} from "app/shared/model/attachment.model";
import {IStockOrderedItem} from "app/shared/model/STOCK/order-Item.model";
import {IStockConfig} from "app/shared/model/STOCK/stock-config.model";

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
  itemStockPurchasingConfig?: IStockConfig;

}

export const defaultValue: Readonly<IStockOrderedItem> = {};
