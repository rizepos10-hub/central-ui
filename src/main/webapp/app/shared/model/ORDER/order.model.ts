import { OrderStatus } from 'app/shared/model/ENUMS/order-status.model';
import { ICustomer } from 'app/shared/model/CUSTOMER/customer.model';
import { IOrderedItem } from 'app/shared/model/ORDER/ordered-item.model';
import { IBill } from 'app/shared/model/ORDER/bill.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';

export interface IOrder extends IOrderAudit {
  id?: string;
  discount?: number | null;
  walkin?: boolean | null;
  status?: OrderStatus | null;
  branchId?: string | null;
  orderSources?: string | null;
  tables?: string | null;
  customer?: ICustomer;
  items?: IOrderedItem[];
  bills?: IBill[];

}

export const defaultValue: Readonly<IOrder> = {
  walkin: false,
};
