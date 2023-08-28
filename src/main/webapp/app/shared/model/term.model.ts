import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import {IAttachment} from "app/shared/model/attachment.model";

export interface ITerm {
  id?: string;
  name?: string;
  taxonomy?: ITaxonomy;
  parents?: ITerm[] | null;
  attachments?: IAttachment | null;
}

export const defaultValue: Readonly<ITerm> = {};
