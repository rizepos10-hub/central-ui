import {IRawItem} from "app/shared/model/STOCK/raw-item.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";

export interface IRawQuantity {
  item?: IRawItem;
  warehouse?: IWarehouse;
  quantity?: number;
  limit?: number;
  threshold?: any;
}

export const defaultValue: Readonly<IRawQuantity> = {};
