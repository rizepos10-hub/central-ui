import { IAttachment } from 'app/shared/model/attachment.model';
import { ITerm } from 'app/shared/model/term.model';
import { ItemStatus } from 'app/shared/model/enumerations/item-status.model';
import {IAccountingGroups} from "app/shared/model/accounting-groups.model";
import {IProductionCenter} from "app/shared/model/production-center.model";
import {IVisibility} from "app/shared/model/visibility.model";
import {ItemVariantType} from "app/shared/model/enumerations/item-variant-type.model";
import {IAddon} from "app/shared/model/addon.model";
import {IAddonGroups} from "app/shared/model/addon-groups.model";

export interface IItem {
  id?: string;
  name?: string;
  desc?: string | null;
  categories?: ITerm[];
  itemVariantType?: ItemVariantType;
  itemType?: "RESTAURANT" | "RETAIL";
  stock?: number;
  addons?: IAddon[];
  addonGroups?: {
    required?: boolean,
    addonGroup?: IAddonGroups
  }[];
  status?: ItemStatus | null;
  variants?: any;
  visibility?: IVisibility;
  attachments?: IAttachment[] | null;
  terms?: ITerm[] | null;
  accountingGroups?: IAccountingGroups[] | null;
  productionCenter?: IProductionCenter | null;

}

export const defaultValue: Readonly<IItem> = {};

