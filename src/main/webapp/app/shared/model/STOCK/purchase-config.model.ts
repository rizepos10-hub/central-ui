import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {ISalesLocation} from "app/shared/model/STOCK/sales-location.model";
import {IStockQuantity} from "app/shared/model/STOCK/stock-quantity.model";

export interface IPurchaseConfig {
  id?: string;
  itemId?: string; // initial model for creation
  variantId?: string; // initial model for creation
  defaultPrice?: number; // initial model for creation
  minOrderQuantity?: number; // initial model for creation
  supplierConfigurations?: ISupplierConfiguration[]; // initial model for creation
  defaultSupplier?: ISupplier;
  item?: IStockConfigItem;
  stockQuantities?: IStockQuantity[];
}


export interface ISupplierConfiguration {
  supplier: ISupplier;
  defaultPrice: number;
  code: string;
}

export interface IStockConfigItem {
  id?: string;
  name?: string;
  variant?: {
    id?: string;
    name?: string;
  }
}






export const defaultValue: Readonly<IPurchaseConfig> = {};
