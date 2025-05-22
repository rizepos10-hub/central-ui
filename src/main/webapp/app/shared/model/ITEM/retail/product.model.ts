import { IItem } from "app/shared/model/ITEM/item.model";
import { IItemMeasure } from "app/shared/model/item-measure.model";
import { IAttributes, IExchangeMeasure, ISimpleItemVariant } from "app/shared/model/ITEM/retail/simple-item.model";
import { IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";
import { ItemLocation } from "app/shared/model/ITEM/retail/item-location.model";
import { ItemVariantType } from "../../ENUMS/item-variant-type.model";

export interface IProduct extends IItem {
  variants?: IVariableItemVariant[];
  attributes?: IAttributes[];
  baseMeasure?: IItemMeasure;
  measures?: IExchangeMeasure[];
  itemLocation?: ItemLocation;
}

export interface ISeo {
  title?: string;
  description?: string;
  keywords?: string;
}

export const defaultValue: Readonly<IProduct> = {
  variants: [{
    pricingPointBranchPrices: [],
    attachments: [],
    branchVariantDetails: {},
    accountingGroups: [],
    description: '',
    discounts: [],
    name: '',
    order: 0,
    supplierAssociations: [],
  }],
  itemType: 'RETAIL',
  itemVariantType: ItemVariantType.RETAIL_SIMPLE,
};
