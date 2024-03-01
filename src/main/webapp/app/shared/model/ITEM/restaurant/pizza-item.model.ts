import {IItem} from "app/shared/model/ITEM/item.model";
import {IAddon} from "app/shared/model/ADDON/addon.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IDiscount} from "app/shared/model/discount.model";
import {IPredefinedPizza} from "app/shared/model/PIZZA/predefined-pizza.model";
import {IPizzaPricingClass} from "app/shared/model/PIZZA/pizza-pricing-class.model";
import {ITopping} from "app/shared/model/PIZZA/topping.model";
import {ICrustType} from "app/shared/model/PIZZA/crust-type.model";
import {ICrustThickness} from "app/shared/model/PIZZA/crust-thickness.model";

interface IMultiplePizzaDetails{
  numberOfPizza?: number;
  freeToppingsNumber?: number;
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

interface IPizzaItemVariant {
  id?: string | null;
  name?: string | null;
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  predefinedPizza?: IPredefinedPizza;
  itemPricingClass?: IPizzaPricingClass;
  toppingPricing?: IToppingPricingItem[];
  crustTypePricing?: ICrustTypePricingItem[];
  crustThicknessPricing?: ICrustThicknessPricingItem[];
  multiplePizzaDetails?: IMultiplePizzaDetails[];
  basePizzaDetails?: IBasePizzaDetail[];
  multiple?: boolean;
  archived?: boolean;
}

export interface IPizzaItem extends IItem{
  variants?: IPizzaItemVariant[];
}

export const defaultValue: Readonly<IPizzaItem> = {};

