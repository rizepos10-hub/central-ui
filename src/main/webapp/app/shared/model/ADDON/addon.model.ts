import { IDiscount } from 'app/shared/model/discount.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { ITag } from "app/shared/model/TAG/tag.model";
import { IAccountingGroup } from "app/shared/model/TAX/accounting-group.model";

export interface IAddon {
  id?: string;
  name?: string;
  desc?: string | null;
  price?: number;
  discounts?: IDiscount[] | null;
  tags?: ITag[];
  accountingGroups?: IAccountingGroup[];
}

export const defaultValue: Readonly<IAddon> = {};
