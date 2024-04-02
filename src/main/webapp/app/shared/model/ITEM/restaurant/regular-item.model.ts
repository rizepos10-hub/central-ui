import {IItem} from "app/shared/model/ITEM/item.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IDiscount} from "app/shared/model/discount.model";
import {IBranch} from "app/shared/model/branch.model";
import {IMixAndMatchRule} from "app/shared/model/mix-and-match-rule.model";

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
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  price?: number;
  salePrice?: number;
  branchVariantDetails?: IBranchVariantDetails;
  mixAndMatchRule?: IMixAndMatchRule;
}

export interface IRegularItem extends IItem{
  variants?: IRegularItemVariant[];
}

export const defaultValue: Readonly<IRegularItem> = {};
