import { ITaxonomy } from 'app/shared/model/taxonomy.model';
import { IAttachment } from "app/shared/model/attachment.model";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { IVisibility } from './visibility.model';

export interface ITerm {
  id?: string;
  name?: string;
  taxonomy?: ITaxonomy;
  parents?: ITerm[] | null;
  attachments?: IAttachment[] | null;
  accountingGroups?: IProfileGroup[];
  order?: number;
  visibility?: IVisibility[];
}

export const defaultValue: Readonly<ITerm> = {};
