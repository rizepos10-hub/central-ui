import { IDiscount } from 'app/shared/model/discount.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { ITag } from "app/shared/model/TAG/tag.model";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { IIngredient } from '../ingredient';

export interface IAddon {
  id?: string;
  name?: string;
  desc?: string | null;
  price?: number;
  extraPrice?: number;
  addPrice?: number;
  showNo?: boolean;
  showEasy?: boolean;
  showExtra?: boolean;
  showAdd?: boolean;
  disableQuantity?: boolean;
  discounts?: IDiscount[] | null;
  tags?: ITag[];
  accountingGroups?: IProfileGroup[];
  ingredients?: IIngredient[];
}

export const defaultValue: Readonly<IAddon> = {
  extraPrice: 0,
  addPrice: 0,
  showNo: true,
  showEasy: true,
  showExtra: true,
  showAdd: true,
  disableQuantity: true,
};
