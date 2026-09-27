import { IAttachment } from 'app/shared/model/attachment.model';
import { ITerm } from 'app/shared/model/term.model';
import { ItemStatus } from 'app/shared/model/ENUMS/item-status.model';
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { IProductionCenter } from "app/shared/model/PRINTER/production-center.model";
import { IVisibility } from "app/shared/model/visibility.model";
import { ItemVariantType } from "app/shared/model/ENUMS/item-variant-type.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import { IAddonGroup, IAddonGroups } from "app/shared/model/ADDON/addon-groups.model";
import { IDiscount } from "app/shared/model/discount.model";
import { ITag } from "app/shared/model/TAG/tag.model";
import { IBrand } from "app/shared/model/brand.model";
import { IAddonPriceOverride } from '../ADDON/addon-price-override';
import { IMenu } from '../menu.model';
import { ISeo } from './retail/product.model';
import { IBranch } from '../branch.model';

export interface IEBTEligibleByBranch {
  branch: IBranch;
  ebtEligible?: boolean;
}

export interface IItem {
  id?: string;
  name?: string;
  desc?: string | null;
  categories?: ITerm[];
  discounts?: IDiscount[];
  byWeight?: boolean | false;
  itemVariantType?: ItemVariantType;
  itemType?: "RESTAURANT" | "RETAIL" | "VIRTUAL";
  stock?: number;
  tags?: ITag[];
  brand?: IBrand;
  addonPriceOverrides?: IAddonPriceOverride[];
  addons?: IAddon[];
  addonGroups?: IAddonGroups[];
  excludedFromLoyaltyPoints?: boolean;
  status?: ItemStatus | null;
  variants?: any;
  visibility?: IVisibility[] | null;
  attachments?: IAttachment[] | null;
  terms?: ITerm[] | null;
  accountingGroups?: IProfileGroup[] | null;
  productionCenter?: IProductionCenter | null;
  menus?: IMenu[];
  askForPrice?: boolean;
  /** When true, POS/kiosk may skip add-ons popup if no required addons. */
  skipAddonsPopup?: boolean;
  seo?: ISeo;
  ebtEligibleByBranch?: IEBTEligibleByBranch[];
  /** How wholesale gets the item; null reads as PRODUCED. */
  wholesaleSourcing?: 'PRODUCED' | 'PURCHASED' | null;
}

export const defaultValue: Readonly<IItem> = {};

