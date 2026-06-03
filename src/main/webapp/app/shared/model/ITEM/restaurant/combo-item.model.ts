import { IItem } from "app/shared/model/ITEM/item.model";
import { IAttachment } from "app/shared/model/attachment.model";
import { IDiscount } from "app/shared/model/discount.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";
import { ISimpleItem } from "app/shared/model/ITEM/retail/simple-item.model";
import { IMixAndMatchRule } from "app/shared/model/mix-and-match-rule.model";
import { ItemVariantType } from "../../ENUMS/item-variant-type.model";
import { IBranchVariantDetails, IPricingPointBranchPrice } from "../retail/variable-item.model";

export interface IComboAddon {
  addon?: IAddon;
  amount?: number;
}

export interface IComboPackage {
  item?: IItem;
  variant?: any;
  amount?: number;
  addons?: IComboAddon[];
}

interface IComboItemVariant {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  price?: number;
  salePrice?: number;
  branchVariantDetails?: IBranchVariantDetails;
  comboPackages?: IComboPackage[];
  mixAndMatchRule?: IMixAndMatchRule;
  pricingPointBranchPrices?: IPricingPointBranchPrice[];
}

export interface IComboItem extends IItem {
  variants?: IComboItemVariant[];
}

export const defaultValue: Readonly<IComboItem> = {
  variants: [{
    pricingPointBranchPrices: [],
    attachments: [],
    branchVariantDetails: {},
    description: '',
    discounts: [],
    name: '',
  }],
  itemType: "RESTAURANT",
  itemVariantType: ItemVariantType.RESTAURANT_COMBO,
  ebtEligibleByBranch: [],
};
