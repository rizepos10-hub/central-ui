import {IRawItem} from "app/shared/model/STOCK/raw-item.model";
import {IMeasurement, IStockItem} from "app/shared/model/STOCK/stock-item.model";
import {IMeasurementUnit} from "app/shared/model/STOCK/measurement-unit.model";

export interface ISupplier {
  id?: string;
  name?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}


export const defaultValue: Readonly<ISupplier> = {};
