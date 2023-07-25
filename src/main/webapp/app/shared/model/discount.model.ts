import { IAddon } from 'app/shared/model/addon.model';
import { DiscountType } from 'app/shared/model/enumerations/discount-type.model';

export interface IDiscount {
  id?: string;
  value?: number;
  type?: DiscountType;
}

export const defaultValue: Readonly<IDiscount> = {};
