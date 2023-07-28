import { IOrderedAddon } from './ordered-addon.model';
import { IOrderAudit } from 'app/shared/model/order-audit.model';

export interface IOrderedItem extends IOrderAudit {
  id?: string;
  price?: number;
  amount?: number;
  discount?: number;
  seats?: string;
  addons?: IOrderedAddon[];
  variantId?: string;
  orderId?: string;
}

export const defaultValue: Readonly<IOrderedItem> = {};
