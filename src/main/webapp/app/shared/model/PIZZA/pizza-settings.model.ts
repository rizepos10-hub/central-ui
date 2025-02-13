import { IPizzaItem } from "../ITEM/restaurant/pizza-item.model";

export interface IPizzaSettings {
    "key": "PIZZA_SETTINGS"
    basePizza: IPizzaItem
}

export const defaultValue: Readonly<IPizzaSettings> = {
    "key": "PIZZA_SETTINGS",
    basePizza: {}
};
