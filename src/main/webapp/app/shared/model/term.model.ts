import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { IItem } from 'app/shared/model/item.model';

export interface ITerm {
  id?: string;
  name?: string;
  taxonomy?: ITaxonomy;
  parents?: ITerm[] | null;
  term?: ITerm | null;
  item?: IItem | null;
}

export const defaultValue: Readonly<ITerm> = {};
