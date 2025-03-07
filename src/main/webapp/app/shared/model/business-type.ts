export type BusinessType = {
    types: BusinessTypeEnum[];
}

export enum BusinessTypeEnum {
    RETAIL = 'RETAIL',
    RESTAURANT = 'RESTAURANT',
}

export const defaultValue: Readonly<BusinessType> = {
    types: [],
};