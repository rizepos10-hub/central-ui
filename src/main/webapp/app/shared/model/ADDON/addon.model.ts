import { IDiscount } from 'app/shared/model/discount.model';
import { IItem } from 'app/shared/model/ITEM/item.model';

export interface IAddon {
  id?: string;
  name?: string;
  desc?: string | null;
  price?: number;
  discounts?: IDiscount[] | null;
  item?: IItem | null;
}

export const defaultValue: Readonly<IAddon> = {};
