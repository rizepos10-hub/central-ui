import {IPurchaseOrder} from "app/shared/model/STOCK/purchase-order.model";
import {ISupplier} from "app/shared/model/STOCK/supplier.model";

export interface ISupplierReturn {
  id?: string;
  purchaseOrder?: IPurchaseOrder;
  supplier?: ISupplier;
}



export const defaultValue: Readonly<ISupplierReturn> = {};
