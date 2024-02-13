import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {ISalesLocation} from "app/shared/model/STOCK/sales-location.model";

export interface IStockConfig {
  id?: string;
  name?: string;
  item?: IStockConfigItem;
  itemId?: string;
  variantId?: string;
  minOrderQuantity?: number;
  supplierConfigurations?: ISupplierConfiguration[];
  defaultPrice?: number;
  description?: string;
  stockQuantities?: IStockQuantity[];
}

export interface IStockQuantity {
  id?: string;
  itemId?: string;
  itemName?: string;
  variantId?: string;
  location?: IWarehouse | ISalesLocation;
  quantity?:number
}

export interface ISupplierConfiguration {
  supplier: ISupplier;
  defaultPrice: number;
}

export interface IStockConfigItem {
  id?: string;
  name?: string;
  variant?: {
    id?: string;
    name?: string;
  }
}






export const defaultValue: Readonly<IStockConfig> = {};
