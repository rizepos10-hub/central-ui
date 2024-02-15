import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IStockOrderedItem} from "app/shared/model/STOCK/order-Item.model";

export interface ISupplierReturn {
  id?: string;
  purchaseOrder?: IPurchaseOrder;
  supplier?: ISupplier;
  status?: "COMPLETED" | "PARKED";
  returnLines?: IReturnLine[];
  comment?: string;
}


export interface IReturnLine {
  orderLineId?: string;
  itemName?: string;
  quantity?: number | null;
  returnPrice?: number | null;
}



export const defaultValue: Readonly<ISupplierReturn> = {};
