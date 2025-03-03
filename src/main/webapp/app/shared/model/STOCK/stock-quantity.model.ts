import { IWarehouse } from "app/shared/model/STOCK/warehouse.model";
import { ISalesLocation } from "app/shared/model/STOCK/sales-location.model";


export interface IStockQuantity {
  id?: string;
  itemId?: string;
  itemName?: string;
  variantId?: string;
  location?: IWarehouse | ISalesLocation;
  quantity?: number
  stockChangeReason?: string;
  minimumStockLevel?: number
  unitCost?: number;
}


export const defaultValue: Readonly<IStockQuantity> = {};
