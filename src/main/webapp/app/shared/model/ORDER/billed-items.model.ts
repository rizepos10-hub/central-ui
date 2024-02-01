import { IReturnedItem } from 'app/shared/model/ORDER/returned-item.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { PaymentStatus } from 'app/shared/model/ENUMS/payment-status.model';
import { BillItemStatus } from 'app/shared/model/ENUMS/bill-item-status.model';
export interface IBilledItem extends IOrderAudit {
  id?: string;
  orderedItemId?: string;
  amount?: number;
  seat?: number;
  returnedItems?: IReturnedItem[];
  paymentStatus?: PaymentStatus;
  status?: BillItemStatus;
}

export const defaultValue: Readonly<IBilledItem> = {};
