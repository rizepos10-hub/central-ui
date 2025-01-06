import { OrderMethod } from '../ENUMS/order-method.model';

export interface IPricingPoint {
    id?: string;
    name?: string;
    type?: PricingPointType;
    automaticType?: AutomaticType;
    orderTypes?: OrderMethod[];
}

export enum PricingPointType {
    USER_SELECTED = 'USER_SELECTED',
    AUTOMATIC = 'AUTOMATIC'
}

export enum AutomaticType {
    ORDER_TYPE = 'ORDER_TYPE'
}

export const defaultValue: Readonly<IPricingPoint> = {};