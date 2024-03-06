import dayjs from 'dayjs';
import { ITerm } from 'app/shared/model/term.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';

export interface IMenu {
  id?: string;
  name?: string;
  createdDate?: string,
  lastModifiedDate?: string,
  category?: ITerm;
  branches?: IBranch[] | null;
  items?: IItem[];
}

export const defaultValue: Readonly<IMenu> = {};
