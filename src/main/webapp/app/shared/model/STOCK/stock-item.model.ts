import {IQuantity} from "app/shared/model/STOCK/stock-quantity.model";
import {IRawItem} from "app/shared/model/STOCK/raw-item.model";
import {IMeasurementUnit} from "app/shared/model/STOCK/measurement-unit.model";

export interface IStockItem {
  id?: string;
  name?: string;
  desc?: string;
  rawItem?: IRawItem;
  itemId?: string;
  purchaseConfig?: IPurchaseConfig;
  ingredients?: IIngredients[];
}

export interface IPurchaseConfig {
  price?: number;
  minOrderQuantity?: string;
  measurements?: IMeasurement[];
}

export interface IMeasurement {
  unit?: IMeasurementUnit;
  rate?: number
}
export interface IIngredients {
  item?: IRawItem;
  quantity?: IQuantity;
}







export const defaultValue: Readonly<IStockItem> = {};
