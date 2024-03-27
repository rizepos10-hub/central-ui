import {IAccountingGroups} from "app/shared/model/TAX/accounting-groups.model";
import {IDiscount} from "app/shared/model/discount.model";


export interface IMixAndMatchRule {
  id?: string;
  name?: string;
  configPerQuantity?: ConfigPerQuantity;
  rules?: Rules;
  exactValue?: boolean;
  requireToBeSameSKU?: boolean;
}

type ConfigPerQuantity = {
  [key: number]: IQuantityConfigurationProperties
}

type Rules = {
  [key: number]: IAccountingGroups;
}

export interface IQuantityConfigurationProperties {
  type?: "DISCOUNT" | "PRICE";
  price?: number;
  discount?: IDiscount;
}

export const defaultValue: Readonly<IMixAndMatchRule> = {};
