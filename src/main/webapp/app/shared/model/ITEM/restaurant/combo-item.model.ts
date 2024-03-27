import {IItem} from "app/shared/model/ITEM/item.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IDiscount} from "app/shared/model/discount.model";
import {IBranch} from "app/shared/model/branch.model";
import {IAddon} from "app/shared/model/ADDON/addon.model";
import {ISimpleItem} from "app/shared/model/ITEM/retail/simple-item.model";
import {IMixAndMatchRule} from "app/shared/model/mix-and-match-rule.model";

interface IBranchVariantDetails {
  [key: string]: {
    branch: IBranch;
    price: number;
    salePrice: number;
  };
}

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
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  price?: number;
  branchVariantDetails?: IBranchVariantDetails;
  comboPackages?: IComboPackage[];
  mixAndMatchRule?: IMixAndMatchRule;
}

export interface IComboItem extends IItem{
  variants?: IComboItemVariant[];
}

export const defaultValue: Readonly<IComboItem> = {};
