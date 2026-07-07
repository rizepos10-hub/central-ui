import {ICustomer} from "app/shared/model/CUSTOMER/customer.model";

export interface ILoyalty {
  id?: string;
  customerId?: string;
  customer?: ICustomer;
  isArchived?: boolean;
  points?: number;
}


export interface ILoyaltyExChange {
  cashToPointExchange: number;
  pointToCashExchange: number;
}
export const defaultValue: Readonly<ILoyalty> = {};
