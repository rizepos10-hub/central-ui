import {PizzaPricingClassType} from "app/shared/model/ENUMS/pizza-pricing-class-type.model";

export interface IPizzaPricingClass {
  id?: string;
  name?: string;
  type?: string;
  prices?: { [key: string]: number };
}

export const defaultValue: Readonly<IPizzaPricingClass> = {};
