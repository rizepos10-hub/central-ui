import {ISupplier} from "app/shared/model/STOCK/supplier.model";

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
