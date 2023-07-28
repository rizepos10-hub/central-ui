import { OrderStatus } from 'app/shared/model/enumerations/order-status.model';
import { ICustomer } from 'app/shared/model/customer.model';
import { IOrderedItem } from 'app/shared/model/ordered-item.model';
import { IBill } from 'app/shared/model/bill.model';
import { IOrderAudit } from 'app/shared/model/order-audit.model';

export interface IOrder extends IOrderAudit {
  id?: string;
  discount?: number | null;
  walkin?: boolean | null;
  status?: OrderStatus | null;
  branchId?: string | null;
  sourceApp?: string | null;
  tables?: string | null;
  customer?: ICustomer;
  items?: IOrderedItem[];
  bills?: IBill[];
}

export const defaultValue: Readonly<IOrder> = {
  walkin: false,
};
