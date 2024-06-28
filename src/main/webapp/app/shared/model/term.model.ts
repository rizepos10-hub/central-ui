import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import {IAttachment} from "app/shared/model/attachment.model";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";

export interface ITerm {
  id?: string;
  name?: string;
  taxonomy?: ITaxonomy;
  parents?: ITerm[] | null;
  attachments?: IAttachment[] | null;
  accountingGroups?: IProfileGroup[];
}

export const defaultValue: Readonly<ITerm> = {};
