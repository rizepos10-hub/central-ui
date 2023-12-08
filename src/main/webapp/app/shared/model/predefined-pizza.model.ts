import { ITopping } from 'app/shared/model/topping.model';

export interface IPredefinedPizza {
  id?: string;
  name?: string;
  toppings?: ITopping[];
}

export const defaultValue: Readonly<IPredefinedPizza> = {};
