import { IAddon } from 'app/shared/model/addon.model';
import { DiscountType } from 'app/shared/model/enumerations/discount-type.model';

export interface IDiscount {
  id?: string;
  value?: number;
  type?: DiscountType;
  addon?: IAddon | null;
}

export const defaultValue: Readonly<IDiscount> = {};
