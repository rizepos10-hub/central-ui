import {ISupplier} from "app/shared/model/STOCK/supplier.model";
import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {IPurchaseConfig} from "app/shared/model/STOCK/purchase-config.model";
import { IItem } from "../ITEM/item.model";

export interface IPurchaseOrder {
  id?: string;
  supplier?: ISupplier;
  status?: "PLACED" | "RECEIVED";
  datePlaced?: Date | string;
  dateDelivered?: Date | string;
  warehouse?: IWarehouse;
  orderLines?: OrderLine[];
  relatedPurchaseOrder?: IPurchaseOrder;
  costLines?:CostLine[];
  delivery?: string;
  address?: string;
}

export type OrderLine = {
  id?: string
  item?: IItem;
  description?:string;
  deliveryDate?: Date | string;
  quantity?: number;
  received?: number;
  returnedQuantity?: number;
  price?: number;
  lineTotal?: number;
}

export type CostLine = {
  supplier?: ISupplier;
  cost?: number;
  costDate?: Date | string;
  comment?: string;
}
export const defaultValue: Readonly<IPurchaseOrder> = {};
