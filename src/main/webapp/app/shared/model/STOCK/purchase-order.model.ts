import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";

export interface IPurchaseOrder {
  id?: string;
  supplier?: ISupplier;
  status?: "PLACED" | "COMPLETED";
  datePlaced?: Date;
  dateDelivered?: Date;
  warehouse?: IWarehouse;
  orderLines?: OrderLines[];
  relatedPurchaseOrder?: IPurchaseOrder;
}

type OrderLines = {
  item?: any;
  quantity?: number;
  receivedQuantity?: number;
  price?: number;
}
export const defaultValue: Readonly<IPurchaseOrder> = {};
