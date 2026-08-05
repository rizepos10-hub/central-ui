import { IItem } from "app/shared/model/ITEM/item.model";
import { IAttachment } from "app/shared/model/attachment.model";
import { IDiscount } from "app/shared/model/discount.model";
import { IBranch } from "app/shared/model/branch.model";
import { ITerm } from "app/shared/model/term.model";
import { ITaxonomy } from "app/shared/model/taxonomy.model";
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { IPurchaseConfig } from "app/shared/model/STOCK/purchase-config.model";
import { IItemMeasure } from "app/shared/model/item-measure.model";
import { IMixAndMatchRule } from "app/shared/model/mix-and-match-rule.model";

interface IBranchVariantDetails {
  [key: string]: {
    branch: IBranch;
    price: number;
    salePrice: number;
    wholesalePrices: IItemPriceNumber;
    hideItem: boolean;
    hideOnline: boolean;
  };
}

export interface IAttributes {
  attributeTax?: ITaxonomy;
  attributeTerms?: ITerm[];
  attachments?: IAttachment[];
  taxonomy?: ITaxonomy;
}

export interface IItemPriceNumber {
  "PRICE_1": number,
  "PRICE_2": number,
  "PRICE_3": number,
  "PRICE_4": number,
  "PRICE_5": number,
}



export interface ISimpleItemVariant {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  skus?: string[];
  price?: number;
  salePrice?: number;
  branchVariantDetails?: IBranchVariantDetails;
  archived?: boolean;
  stockQuantities?: IStockQuantity[];
  purchaseConfig?: IPurchaseConfig;
  mixAndMatchRule?: IMixAndMatchRule;
}

export interface ISimpleItem extends IItem {
  variants?: ISimpleItemVariant[];
  attributes?: IAttributes[];
  baseMeasure?: IItemMeasure;
  measures?: IExchangeMeasure[];
}

export interface IExchangeMeasure {
  itemMeasure?: IItemMeasure;
  exchangeRate?: number;
}

export const defaultValue: Readonly<ISimpleItem> = {};

