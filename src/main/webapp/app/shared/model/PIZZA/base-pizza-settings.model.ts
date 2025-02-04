import { IPizzaItem } from "../ITEM/restaurant/pizza-item.model";

export interface IBasePizzaSettings {
    "key": "PIZZA_SETTINGS"
    basePizza: IPizzaItem
}

export const defaultValue: Readonly<IBasePizzaSettings> = {
    "key": "PIZZA_SETTINGS",
    basePizza: {}
};
