import {ICustomer} from "app/shared/model/customer.model";

export interface ILoyalty {
  id?: string;
  customer?: ICustomer;
  isArchived?: boolean;
  points?: number;
}
export const defaultValue: Readonly<ILoyalty> = {};
