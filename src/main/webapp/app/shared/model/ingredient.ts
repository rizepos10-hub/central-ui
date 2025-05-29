import { IItem } from "./ITEM/item.model";

export interface IIngredient {
    item?: IItem
    variantId: string
    quantity: number
}