import { IItem } from "app/shared/model/ITEM/item.model";
import { IAttachment } from "app/shared/model/attachment.model";
import { IDiscount } from "app/shared/model/discount.model";
import { IBranch } from "app/shared/model/branch.model";
import { ITerm } from "app/shared/model/term.model";
import { ITaxonomy } from "app/shared/model/taxonomy.model";
import { IStockQuantity } from "app/shared/model/STOCK/stock-quantity.model";
import { IPurchaseConfig } from "app/shared/model/STOCK/purchase-config.model";
import { IItemMeasure } from "app/shared/model/item-measure.model";
import { IExchangeMeasure, IItemPriceNumber } from "app/shared/model/ITEM/retail/simple-item.model";
import { IMixAndMatchRule } from "app/shared/model/mix-and-match-rule.model";
import { IProfileGroup } from "app/shared/model/TAX/profile-group.model";
import { ShippingDimension } from "app/shared/model/shipping-dimension.model";
import { IPricingPoint } from "../../PRICING-POINT/pricing-point";

export interface IBranchVariantDetails {
  [key: string]: {
    branch: IBranch;
    price: number;
    salePrice: number;
    wholesalePrices?: IItemPriceNumber;
    hideItem?: boolean;
    hideOnline?: boolean;
  };
}
interface IAttributes {
  attributeTax?: ITaxonomy;
  attributeTerms?: ITerm[];
  attachments?: IAttachment[];
}
export interface IVariableItemVariant {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  attachments?: IAttachment[];
  order?: number;
  discounts?: IDiscount[];
  accountingGroups?: IProfileGroup[];
  sku?: string;
  price?: number;
  salePrice?: number;
  branchVariantDetails?: IBranchVariantDetails;
  archived?: boolean;
  attributeValues?: any;
  stockQuantities?: IStockQuantity[];
  purchaseConfig?: IPurchaseConfig;
  mixAndMatchRule?: IMixAndMatchRule;
  variantPackage?: IVariantPackage | null;
  itemMeasure?: IItemMeasure;
  shippingDimension?: ShippingDimension | null;
  measureValue?: IMeasureValue;
  pricingPointBranchPrices?: IPricingPointBranchPrice[];
  supplierAssociations?: ISupplierAssociation[];
}

export interface ISupplierAssociation {
  supplierId: string;
  supplierCode: string;
}

export interface IPricingPointBranchPrice {
  branch: IBranch;
  pricingPoint: IPricingPoint;
  price: number;
}

export interface IMeasureValue {
  // measure: number,
  isBase?: boolean,
}

export interface IVariableItem extends IItem {
  variants?: IVariableItemVariant[];
  attributes?: IAttributes[];
  baseMeasure?: IItemMeasure;
  measures?: IExchangeMeasure[];
}

export interface IVariantPackage {
  variantId?: string;
  name?: string;
  quantity?: number;
  id?: string;
}

export const defaultValue: Readonly<IVariableItem> = {};

