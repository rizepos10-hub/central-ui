import { IBranch } from "../branch.model";
import { IPizzaItem } from "../ITEM/restaurant/pizza-item.model";

export interface IPizzaSettings {
    "key": "PIZZA_SETTINGS"
    basePizza: IPizzaItem
    makeYourOwnPizza: IPizzaItem
    pizzaSettingsByBranch: IPizzaSettingsByBranch[]
}

export interface IPizzaSettingsByBranch {
    branch: IBranch
    selectedPizzaFallbackOption: 'BASE' | 'MAKE_YOUR_OWN' | 'APPEND_ADDITIONAL_TOPPINGS'
    showToppingsOnPredefinedPizza: boolean
}

export const defaultValue: Readonly<IPizzaSettings> = {
    "key": "PIZZA_SETTINGS",
    basePizza: {},
    makeYourOwnPizza: {},
    pizzaSettingsByBranch: []
};
