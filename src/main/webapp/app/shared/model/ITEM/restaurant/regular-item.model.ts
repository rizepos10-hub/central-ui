import { IItem } from "app/shared/model/ITEM/item.model";
import { IAttachment } from "app/shared/model/attachment.model";
import { IDiscount } from "app/shared/model/discount.model";
import { IBranch } from "app/shared/model/branch.model";
import { IMixAndMatchRule } from "app/shared/model/mix-and-match-rule.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { IMenu } from "../../menu.model";
import { IAddonGroup, IAddonGroups } from "../../ADDON/addon-groups.model";
import { IAddonPriceOverride } from "../../ADDON/addon-price-override";
import { IPricingPointBranchPrice } from "../retail/variable-item.model";
import { ItemVariantType } from "../../ENUMS/item-variant-type.model";
import { IIngredient } from "../../ingredient";

interface IBranchVariantDetails {
  [key: string]: {
    branch: IBranch;
    price: number;
    salePrice: number;
  };
}

export interface IRegularItemVariant {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  attachments?: IAttachment[];
  accountingGroups?: IProfileGroup[];
  order?: number;
  discounts?: IDiscount[];
  addonPriceOverrides?: IAddonPriceOverride[];
  addons?: IAddon[];
  addonGroups?: IAddonGroups[];
  price?: number;
  salePrice?: number;
  branchVariantDetails?: IBranchVariantDetails;
  mixAndMatchRule?: IMixAndMatchRule;
  pricingPointBranchPrices?: IPricingPointBranchPrice[];
  ingredients?: IIngredient[];
}

export interface IRegularItem extends IItem {
  variants?: IRegularItemVariant[];
  menus?: IMenu[];
}

export const defaultValue: Readonly<IRegularItem> = {
  variants: [{
    pricingPointBranchPrices: [],
    attachments: [],
    branchVariantDetails: {},
    accountingGroups: [],
    description: '',
    discounts: [],
    name: '',
    order: 0,
    addonGroups: [],
    addonPriceOverrides: [],
    addons: [],
  }],
  itemType: "RESTAURANT",
  itemVariantType: ItemVariantType.RESTAURANT_VARIABLE,
  ebtEligibleByBranch: [],
};
