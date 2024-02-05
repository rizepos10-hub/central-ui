import {IStockItem} from "app/shared/model/STOCK/stock-item.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {IMeasurementUnit} from "app/shared/model/STOCK/measurement-unit.model";

export interface IQuantity {
  value?: number;
  unit?: IMeasurementUnit;
}
export interface IStockQuantity {
  id?: string;
  item?: IStockItem;
  warehouse?: IWarehouse;
  quantity?: IQuantity;
  threshold?: any
}

export const defaultValue: Readonly<IStockQuantity> = {};
