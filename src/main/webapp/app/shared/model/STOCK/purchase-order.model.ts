import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {IStockConfig} from "app/shared/model/STOCK/stock-config.model";

export interface IPurchaseOrder {
  id?: string;
  supplier?: ISupplier;
  status?: "PLACED" | "COMPLETED";
  datePlaced?: Date;
  dateDelivered?: Date;
  warehouse?: IWarehouse;
  orderLines?: OrderLine[];
  relatedPurchaseOrder?: IPurchaseOrder;
}

export type OrderLine = {
  item?: IStockConfig;
  quantity?: number;
  receivedQuantity?: number;
  price?: number;
}
export const defaultValue: Readonly<IPurchaseOrder> = {};
