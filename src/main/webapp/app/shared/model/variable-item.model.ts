import {IItem} from "app/shared/model/item.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IDiscount} from "app/shared/model/discount.model";
import {IBranch} from "app/shared/model/branch.model";
import {ITerm} from "app/shared/model/term.model";
import {ITaxonomy} from "app/shared/model/taxonomy.model";

interface IBranchVariantDetails {
  [key: string]: {
    branch: IBranch;
    price: number;
    salePrice: number;
  };
}
interface IAttributes {
  attributeTax?:ITaxonomy;
  attributeTerms?: ITerm[];
  attachments?: IAttachment[];
}
interface IVariableItemVariant {
  id?: string | null;
  name?: string | null;
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  sku?: string;
  price?: number;
  salePrice?: number;
  branchVariantDetails?: IBranchVariantDetails;
  archived?: boolean;
  attributeValues?: any;
}

export interface IVariableItem extends IItem{
  variants?: IVariableItemVariant[];
  attributes?: IAttributes[];
}

export const defaultValue: Readonly<IVariableItem> = {};

