import {IPizzaSize} from "app/shared/model/pizza-size.model";

export interface ICrustThickness {
  id?: string;
  name?: string;
  hiddenOnSizes?: any[];
}

export const defaultValue: Readonly<ICrustThickness> = {};
