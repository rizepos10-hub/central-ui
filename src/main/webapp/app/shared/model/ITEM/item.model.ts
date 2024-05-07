import { IAttachment } from 'app/shared/model/attachment.model';
import { ITerm } from 'app/shared/model/term.model';
import { ItemStatus } from 'app/shared/model/ENUMS/item-status.model';
import {IAccountingGroup} from "app/shared/model/TAX/accounting-group.model";
import {IProductionCenter} from "app/shared/model/PRINTER/production-center.model";
import {IVisibility} from "app/shared/model/visibility.model";
import {ItemVariantType} from "app/shared/model/ENUMS/item-variant-type.model";
import {IAddon} from "app/shared/model/ADDON/addon.model";
import {IAddonGroup} from "app/shared/model/ADDON/addon-groups.model";
import { IDiscount } from "app/shared/model/discount.model";
import { ITag } from "app/shared/model/TAG/tag.model";

export interface IItem {
  id?: string;
  name?: string;
  desc?: string | null;
  categories?: ITerm[];
  discounts?: IDiscount[];
  itemVariantType?: ItemVariantType;
  itemType?: "RESTAURANT" | "RETAIL";
  stock?: number;
  tags?: ITag[];
  addons?: IAddon[];
  addonGroups?: {
    required?: boolean,
    addonGroup?: IAddonGroup
  }[];
  excludedFromLoyaltyPoints?: boolean;
  status?: ItemStatus | null;
  variants?: any;
  visibility?: IVisibility[] | null;
  attachments?: IAttachment[] | null;
  terms?: ITerm[] | null;
  accountingGroups?: IAccountingGroup[] | null;
  productionCenter?: IProductionCenter | null;

}

export const defaultValue: Readonly<IItem> = {};

