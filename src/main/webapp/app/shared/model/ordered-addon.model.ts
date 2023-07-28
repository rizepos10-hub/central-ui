import { IOrderAudit } from 'app/shared/model/order-audit.model';

export interface IOrderedAddon extends IOrderAudit {
  id?: string;
  price?: number;
  discount?: number;
  amount?: number;
  addonId?: string;
  text?: string;
}
export const defaultValue: Readonly<IOrderedAddon> = {};
