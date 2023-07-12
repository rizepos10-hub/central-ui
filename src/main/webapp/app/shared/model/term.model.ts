import { ITaxonomy } from 'app/shared/model/taxonomy.model';

export interface ITerm {
  id?: string;
  name?: string;
  taxonomy?: ITaxonomy;
  parents?: ITerm[] | null;
  term?: ITerm | null;
}

export const defaultValue: Readonly<ITerm> = {};
