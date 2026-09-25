import { IAddon } from 'app/shared/model/ADDON/addon.model';
import { DiscountType } from 'app/shared/model/ENUMS/discount-type.model';

export interface IDiscount {
  id?: string;
  value?: number;
  type?: DiscountType;
  isDefault?: boolean;
}

export const defaultValue: Readonly<IDiscount> = {};
