import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IStockItem} from "app/shared/model/STOCK/stock-item.model";
import {IRawItem} from "app/shared/model/STOCK/raw-item.model";

export interface ISupplierReturn {
  id?: string;
  purchaseOrder?: IPurchaseOrder;
  supplier?: ISupplier;
  stockItems?: ISupplierReturnStockItem[];
  rawItems?: ISupplierReturnRawItem[];
}

interface ISupplierReturnStockItem {
  item?: IStockItem;
  quantity?: number;
  returnPrice?: number;
}
interface ISupplierReturnRawItem {
  item?: IRawItem;
  quantity?: number;
  returnPrice?: number;
}


export const defaultValue: Readonly<ISupplierReturn> = {};
