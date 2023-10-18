import { IAttachment } from 'app/shared/model/attachment.model';
import { IAddon } from 'app/shared/model/addon.model';
import { ITerm } from 'app/shared/model/term.model';
import { IMenu } from 'app/shared/model/menu.model';
import { ItemStatus } from 'app/shared/model/enumerations/item-status.model';
import { IVariant } from 'app/shared/model/variants.model';
import {IAccountingGroups} from "app/shared/model/accounting-groups.model";
import {IProductionCenter} from "app/shared/model/production-center.model";

export interface IItem {
  id?: string;
  name?: string;
  desc?: string | null;
  orderCount?: number | null;
  avgRating?: number | null;
  ratingCount?: number | null;
  stock?: number;
  status?: ItemStatus | null;
  attachments?: IAttachment[] | null;
  addons?: IAddon[] | null;
  terms?: ITerm[] | null;
  menu?: IMenu | null;
  variants?: IVariant[];
  accountingGroups?: IAccountingGroups[] | null;
  productionCenter?: IProductionCenter | null;
}

export const defaultValue: Readonly<IItem> = {};
