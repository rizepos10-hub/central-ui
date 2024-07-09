import dayjs from 'dayjs';
import { ITerm } from 'app/shared/model/term.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { IVisibility } from "app/shared/model/visibility.model";

export interface IMenu {
  id?: string;
  name?: string;
  createdDate?: string,
  lastModifiedDate?: string,
  category?: ITerm;
  branches?: IBranch[] | null;
  items?: IItem[];
  menuScreens?: any[];
  excludedItems?: IItem[];
  itemType?: "RETAIL" | "RESTAURANT" | null;
  branch?: IBranch;
  visibilities?: IVisibility[];
  type?: "POS" | "ONLINE_ORDERING";
}

export const defaultValue: Readonly<IMenu> = {};
