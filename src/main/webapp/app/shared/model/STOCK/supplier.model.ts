import {IRawItem} from "app/shared/model/STOCK/raw-item.model";
import {IMeasurement, IStockItem} from "app/shared/model/STOCK/stock-item.model";
import {IMeasurementUnit} from "app/shared/model/STOCK/measurement-unit.model";

export interface ISupplier {
  id?: string;
  name?: string;
  rawItems?: ISupplierRawItem[];
  stockItems?: ISupplierStockItem[];
}
interface ISupplierRawItem {
  item?: IRawItem;
  defaultPrice?: number;
  unit?: IMeasurementUnit;
}

interface ISupplierStockItem {
  item?: IStockItem;
  defaultPrice?: number;
  unit?: IMeasurementUnit;
}

export const defaultValue: Readonly<ISupplier> = {};
