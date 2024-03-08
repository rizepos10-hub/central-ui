import {IItem} from "app/shared/model/ITEM/item.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IDiscount} from "app/shared/model/discount.model";
import {IBranch} from "app/shared/model/branch.model";
import {ITerm} from "app/shared/model/term.model";
import {ITaxonomy} from "app/shared/model/taxonomy.model";
import {IStockQuantity} from "app/shared/model/STOCK/stock-quantity.model";
import {IPurchaseConfig} from "app/shared/model/STOCK/purchase-config.model";
import {IItemMeasure} from "app/shared/model/item-measure.model";
import {IExchangeMeasure, IItemPriceNumber} from "app/shared/model/ITEM/retail/simple-item.model";

interface IBranchVariantDetails {
  [key: string]: {
    branch: IBranch;
    price: number;
    salePrice: number;
    wholesalePrices: IItemPriceNumber;

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
  stockQuantities?: IStockQuantity[];
  purchaseConfig?: IPurchaseConfig;
}

export interface IVariableItem extends IItem{
  variants?: IVariableItemVariant[];
  attributes?: IAttributes[];
  baseMeasure?: IItemMeasure;
  measures?: IExchangeMeasure[];
}

export const defaultValue: Readonly<IVariableItem> = {};

