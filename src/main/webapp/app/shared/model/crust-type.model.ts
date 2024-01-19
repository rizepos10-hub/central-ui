import {IPizzaSize} from "app/shared/model/pizza-size.model";
import {IPizzaPricingClass} from "app/shared/model/pizza-pricing-class.model";

export interface ICrustType {
  id?: string;
  name?: string;
  hiddenOnSizes?: IPizzaSize[];
  pricingClass?: IPizzaPricingClass;
  chosenByDefault?: boolean;

}

export const defaultValue: Readonly<ICrustType> = {};
