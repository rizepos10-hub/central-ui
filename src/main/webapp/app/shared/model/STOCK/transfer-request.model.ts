import {IWareHouse} from "app/shared/model/STOCK/warehouse.model";
import {IStockItem} from "app/shared/model/STOCK/stock-item.model";
import {IRawItem} from "app/shared/model/STOCK/raw-item.model";

export interface ITransferRequest {
  id?: string;
  source?: IWareHouse;
  destination?: IWareHouse;
  stockItems?: ITransferRequestStockItem[];
  rawItems?: ITransferRequestRawItem[];
}

interface ITransferRequestStockItem {
  item?: IStockItem;
  quantity?: number;
}
interface ITransferRequestRawItem {
  item?: IRawItem;
  quantity?: number;
}
export const defaultValue: Readonly<ITransferRequest> = {};
