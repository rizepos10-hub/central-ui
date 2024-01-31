import { ITopping } from 'app/shared/model/PIZZA/topping.model';

export interface IPredefinedPizza {
  id?: string;
  name?: string;
  toppings?: ITopping[];
  base?: boolean;
}

export const defaultValue: Readonly<IPredefinedPizza> = {};
