import {PizzaPricingClassType} from "app/shared/model/enumerations/pizza-pricing-class-type.model";

export interface IPizzaPricingClass {
  id?: string;
  name?: string;
  type?: string;
  prices?: { [key: string]: number };
}

export const defaultValue: Readonly<IPizzaPricingClass> = {};
