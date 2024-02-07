import {IWarehouse} from "app/shared/model/STOCK/warehouse.model";
import {IStockConfig} from "app/shared/model/STOCK/stock-config.model";

export interface ITransferRequest {
  id?: string;
  source?: IWarehouse;
  destination?: IWarehouse;

}


export const defaultValue: Readonly<ITransferRequest> = {};
