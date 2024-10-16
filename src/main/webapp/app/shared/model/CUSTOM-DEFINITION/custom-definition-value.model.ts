import { ICustomDefinition } from "./custom-definition.model";

export interface ICustomDefinitionValue {
    id?: string;
    value?: any;
    entityType?: CustomDefinitionEntityType;
    entityId?: string;
    valueCasted?: IValueCasted;
    definition?: ICustomDefinition;
}

export interface IValueCasted {
    aInstant?: any;
    aString?: string;
    anInteger?: number;
    aDouble?: number;
    aBoolean?: boolean;
}

export enum CustomDefinitionEntityType {    
    ITEM = 'ITEM',
    PREDEFINED_PIZZA = 'PREDEFINED_PIZZA',
    PIZZA_TOPPING = 'PIZZA_TOPPING',
    PIZZA_PRICING_CLASS = 'PIZZA_PRICING_CLASS',
    PIZZA_SIZE = 'PIZZA_SIZE',
    PIZZA_CRUST_THICKNESS = 'PIZZA_CRUST_THICKNESS',
    PIZZA_CRUST_TYPE = 'PIZZA_CRUST_TYPE',
    PIZZA_TOPPING_GROUP = 'PIZZA_TOPPING_GROUP',
    ADDON = 'ADDON',
    ADDON_GROUP = 'ADDON_GROUP',
    BRAND = 'BRAND',
    SUPPLIER = 'SUPPLIER',
    TAXONOMY = 'TAXONOMY',
    TERM = 'TERM',    
    ATTACHMENT = 'ATTACHMENT'
}

export const defaultValue: Readonly<ICustomDefinitionValue> = {
    value: '',
    entityType: CustomDefinitionEntityType.ITEM,
    entityId: '',
    definition: {}
};