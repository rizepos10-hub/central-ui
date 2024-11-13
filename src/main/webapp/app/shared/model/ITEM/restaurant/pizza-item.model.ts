import {IItem} from "app/shared/model/ITEM/item.model";
import {IAddon} from "app/shared/model/ADDON/addon.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IDiscount} from "app/shared/model/discount.model";
import {IPredefinedPizza} from "app/shared/model/PIZZA/predefined-pizza.model";
import {IPizzaPricingClass} from "app/shared/model/PIZZA/pizza-pricing-class.model";
import {ITopping} from "app/shared/model/PIZZA/topping.model";
import {ICrustType} from "app/shared/model/PIZZA/crust-type.model";
import {ICrustThickness} from "app/shared/model/PIZZA/crust-thickness.model";
import {IMixAndMatchRule} from "app/shared/model/mix-and-match-rule.model";
import { IPizzaSize } from "../../PIZZA/pizza-size.model";

interface IMultiplePizzaDetails{
  numberOfPizza?: number;
  freeToppingsNumber?: number;
  fixedPrice?: number;
  pizzaDefaults: IPizzaDefaults[];
}

export interface IPizzaDefaults {
  id?: string;
  pizzaSize?: IPizzaSize;
  defaultCrustType: ICrustType;
  defaultCrustThickness: ICrustThickness;
}

export interface IToppingPricingItem {
  topping: ITopping;
  pricingClass: IPizzaPricingClass;
}

export interface ICrustTypePricingItem {
  crustType: ICrustType;
  pricingClass: IPizzaPricingClass;
}

export interface ICrustThicknessPricingItem {
  crustThickness: ICrustThickness;
  pricingClass: IPizzaPricingClass;
}

export interface IBasePizzaDetail {
  toppingsNumber: number;
  pricingClass: IPizzaPricingClass;
}

export interface IPizzaItemVariant {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  mixAndMatchRule?: IMixAndMatchRule;
  predefinedPizza?: IPredefinedPizza;
  itemPricingClass?: IPizzaPricingClass;
  toppingPricing?: IToppingPricingItem[];
  crustTypePricing?: ICrustTypePricingItem[];
  crustThicknessPricing?: ICrustThicknessPricingItem[];
  multiplePizzaDetails?: IMultiplePizzaDetails;
  basePizzaDetails?: IBasePizzaDetail[];
  multiple?: boolean;
  archived?: boolean;
}

export interface IPizzaItem extends IItem{
  variants?: IPizzaItemVariant[];
}

export const defaultValue: Readonly<IPizzaItem> = {};

