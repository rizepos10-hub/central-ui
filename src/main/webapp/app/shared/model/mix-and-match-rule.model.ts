import {IProfileGroup} from "app/shared/model/TAX/profile-group.model";
import {IDiscount} from "app/shared/model/discount.model";


export interface IMixAndMatchRule {
  id?: string;
  name?: string;
  configPerQuantity?: IQuantityConfigurationProperties[];
  rules?: Rule[];
  exactValue?: boolean;
  requireToBeSameSKU?: boolean;
}



type Rule = {
  aboveQuantity?: number;
  accountingGroup?: IProfileGroup;
}

export interface IQuantityConfigurationProperties {
  quantity?: number
  type?: "DISCOUNT" | "PRICE";
  price?: number;
  discount?: IDiscount;
}

export const defaultValue: Readonly<IMixAndMatchRule> = {};
