import {IStockItem} from "app/shared/model/STOCK/stock-item.model";
import {IWareHouse} from "app/shared/model/STOCK/warehouse.model";
import {IMeasurementUnit} from "app/shared/model/STOCK/measurement-unit.model";

export interface IQuantity {
  value?: number;
  unit?: IMeasurementUnit;
}
export interface IStockQuantity {
  id?: string;
  item?: IStockItem;
  warehouse?: IWareHouse;
  quantity?: IQuantity;
  threshold?: any
}

export const defaultValue: Readonly<IStockQuantity> = {};
