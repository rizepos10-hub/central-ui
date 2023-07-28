import { IReturnedItem } from 'app/shared/model/returned-item.model';
import { IOrderAudit } from 'app/shared/model/order-audit.model';
import { PaymentStatus } from 'app/shared/model/enumerations/payment-status.model';
import { BillItemStatus } from 'app/shared/model/enumerations/bill-item-status.model';
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
