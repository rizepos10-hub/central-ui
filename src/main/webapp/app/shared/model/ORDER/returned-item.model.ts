import { ReturnedItemType } from 'app/shared/model/ENUMS/returned-item-type.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';

export interface IReturnedItem extends IOrderAudit {
  id?: string;
  amount?: string;
  type?: ReturnedItemType;
}
export const defaultValue: Readonly<IReturnedItem> = {};
