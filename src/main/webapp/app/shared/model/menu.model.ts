import dayjs from 'dayjs';
import { ITerm } from 'app/shared/model/term.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/item.model';

export interface IMenu {
  id?: string;
  name?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  category?: ITerm;
  branches?: IBranch[] | null;
  items?: IItem[];
}

export const defaultValue: Readonly<IMenu> = {};
