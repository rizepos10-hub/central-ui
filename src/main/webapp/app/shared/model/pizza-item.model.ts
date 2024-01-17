import {IItem} from "app/shared/model/item.model";
import {IAddon} from "app/shared/model/addon.model";
import {IAddonGroups} from "app/shared/model/addon-groups.model";
import {IAttachment} from "app/shared/model/attachment.model";
import {IDiscount} from "app/shared/model/discount.model";
import {IPredefinedPizza} from "app/shared/model/predefined-pizza.model";
import {IPizzaPricingClass} from "app/shared/model/pizza-pricing-class.model";
import {ITopping} from "app/shared/model/topping.model";
import {ICrustType} from "app/shared/model/crust-type.model";
import {ICrustThickness} from "app/shared/model/crust-thickness.model";

interface IMultiplePizzaDetails{
  numberOfPizza?: number;
  freeToppingsNumber?: number;
}

interface IToppingPricingItem {
  topping: ITopping;
  pricingClass: IPizzaPricingClass;
}

interface ICrustTypePricingItem {
  crustType: ICrustType;
  pricingClass: IPizzaPricingClass;
}

interface ICrustThicknessPricingItem {
  crustThickness: ICrustThickness;
  pricingClass: IPizzaPricingClass;
}

interface IPizzaItemVariant {
  id?: string | null;
  name?: string | null;
  attachments?: IAttachment[];
  discounts?: IDiscount[];
  predefinedPizza?: IPredefinedPizza[];
  itemPricingClass?: IPizzaPricingClass;
  toppingPricing?: IToppingPricingItem[];
  crustTypePricing?: ICrustTypePricingItem[];
  crustThicknessPricing?: ICrustThicknessPricingItem[];
  multiplePizzaDetails?: IMultiplePizzaDetails[];
  multiple?: boolean;
  archived?: boolean;
}

export interface IPizzaItem extends IItem{
  variants?: IPizzaItemVariant[];
}

export const defaultValue: Readonly<IPizzaItem> = {};

