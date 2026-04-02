import { IOrderAudit } from 'app/shared/model/ORDER/order-audit.model';
import { IDiscount } from "app/shared/model/discount.model";

export interface IOrderedAddon extends IOrderAudit {
  name?: string;
  id?: string;
  status?: string | null;
  price?: number;
  discount?: IDiscount;
  amount?: number;
  addonId?: string;
  text?: string;
  taxIdsToValues?: any[];
  taxValue?: number;
  total?: number | null,
}

export const defaultValue: Readonly<IOrderedAddon> = {};
