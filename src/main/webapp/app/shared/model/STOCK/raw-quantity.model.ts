import {IRawItem} from "app/shared/model/STOCK/raw-item.model";
import {IWareHouse} from "app/shared/model/STOCK/warehouse.model";

export interface IRawQuantity {
  item?: IRawItem;
  warehouse?: IWareHouse;
  quantity?: number;
  limit?: number;
  threshold?: any;
}

export const defaultValue: Readonly<IRawQuantity> = {};
