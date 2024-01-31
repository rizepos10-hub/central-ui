import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';

export interface IOrderedAddon extends IOrderAudit {
  name?: string;
  id?: string;
  price?: number;
  discount?: number;
  amount?: number;
  addonId?: string;
  text?: string;
}
export const defaultValue: Readonly<IOrderedAddon> = {};
