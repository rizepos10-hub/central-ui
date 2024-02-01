import {IPurchaseConfig} from "app/shared/model/STOCK/stock-item.model";

export interface IRawItem {
  id?: string;
  name?: string;
  desc?: string;
  purchaseConfig?: IPurchaseConfig;
}

export const defaultValue: Readonly<IRawItem> = {};
