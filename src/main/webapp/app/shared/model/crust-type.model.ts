import {IPizzaSize} from "app/shared/model/pizza-size.model";

export interface ICrustType {
  id?: string;
  name?: string;
  hiddenOnSizes?: IPizzaSize[];
}

export const defaultValue: Readonly<ICrustType> = {};
