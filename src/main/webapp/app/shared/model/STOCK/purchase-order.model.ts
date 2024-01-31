import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWareHouse} from "app/shared/model/STOCK/warehouse.model";
import {IStockItem} from "app/shared/model/STOCK/stock-item.model";
import {IQuantity} from "app/shared/model/STOCK/stock-quantity.model";
import {IRawItem} from "app/shared/model/STOCK/raw-item.model";

export interface IPurchaseOrder {
  supplier?: ISupplier;
  status?: "PLACED" | "RECIEPT" | "COMPLETED";
  datePlaced?: Date;
  dateDelivered?: Date;
  warehouse?: IWareHouse;
  stockItems?: IPurchaseOrderStockItem;
  rawItems?: IPurchaseOrderRawItem;
}

interface IPurchaseOrderStockItem {
  item?: IStockItem;
  quantity?: IQuantity;
  price?: number;
}
interface IPurchaseOrderRawItem {
  item?: IRawItem;
  quantity?: IQuantity;
  price?: number;
}

export const defaultValue: Readonly<IPurchaseOrder> = {};
