import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {IStockOrderedItem} from "app/shared/model/STOCK/order-Item.model";
import {ISalesLocation} from "app/shared/model/STOCK/sales-location.model";

export interface ITransferRequest {
  id?: string;
  source?: IWarehouse | ISalesLocation;
  destination?: IWarehouse | ISalesLocation;
  transferItems?: ITRItem[];
  status?: "PLACED" | "CONFIRMED"
}

export interface ITRItem{
  item?: IStockOrderedItem;
  quantity?: number;
  receivedQuantity?: number;
}

export const defaultValue: Readonly<ITransferRequest> = {};
