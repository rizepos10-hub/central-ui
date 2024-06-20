import { IItem } from "app/shared/model/ITEM/item.model";
import { IItemMeasure } from "app/shared/model/item-measure.model";
import { IAttributes, IExchangeMeasure, ISimpleItemVariant } from "app/shared/model/ITEM/retail/simple-item.model";
import { IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";

export interface IProduct extends IItem{
  variants?: IVariableItemVariant[];
  attributes?: IAttributes[];
  baseMeasure?: IItemMeasure;
  measures?: IExchangeMeasure[];
}

export const defaultValue: Readonly<IProduct> = {};
