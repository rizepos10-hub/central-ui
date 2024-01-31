import {IPizzaPricingClass} from "app/shared/model/PIZZA/pizza-pricing-class.model";
import {IPizzaSize} from "app/shared/model/PIZZA/pizza-size.model";

export interface ICrustThickness {
  id?: string;
  name?: string;
  hiddenOnSizes?: IPizzaSize[];
  pricingClass?: IPizzaPricingClass;
  chosenByDefault?: boolean;
}

export const defaultValue: Readonly<ICrustThickness> = {};
