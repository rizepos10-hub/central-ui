import { IOrderedAddon } from './ordered-addon.model';
import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';

export interface IOrderedItem extends IOrderAudit {
  returnedAmount?: number;
  sequenceNumber?: number ;
  itemName?: string;
  variantName?: string;
  id?: string;
  price?: number;
  amount?: number;
  discount?: any;
  seats?: string;
  addons?: IOrderedAddon[];
  variantId?: string;
  orderId?: string;
}

export const defaultValue: Readonly<IOrderedItem> = {};
