import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {IMeasurementUnit} from "app/shared/model/STOCK/measurement-unit.model";
import {IStockConfig} from "app/shared/model/STOCK/stock-config.model";

export interface IQuantity {
  value?: number;
  unit?: IMeasurementUnit;
}
export interface IStockQuantity {
  id?: string;
  item?: IStockConfig;
  warehouse?: IWarehouse;
  quantity?: IQuantity;
  threshold?: any
}

export const defaultValue: Readonly<IStockQuantity> = {};
