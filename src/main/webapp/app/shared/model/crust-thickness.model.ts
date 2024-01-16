import {IPizzaPricingClass} from "app/shared/model/pizza-pricing-class.model";
import {IPizzaSize} from "app/shared/model/pizza-size.model";

export interface ICrustThickness {
  id?: string;
  name?: string;
  hiddenOnSizes?: IPizzaSize[];
  pricingClass?: IPizzaPricingClass
}

export const defaultValue: Readonly<ICrustThickness> = {};
