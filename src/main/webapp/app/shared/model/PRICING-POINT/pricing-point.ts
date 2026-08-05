import { IBranch } from '../branch.model';
import { OrderMethod } from '../ENUMS/order-method.model';

export interface IPricingPoint {
    id?: string;
    name?: string;
    type?: PricingPointType;
    automaticType?: AutomaticType;
    orderTypes?: OrderMethod[];
    applicableBranches?: IBranch[]
    applicationTypes?: ApplicationTypes[];
}

export enum PricingPointType {
    USER_SELECTED = 'USER_SELECTED',
    AUTOMATIC = 'AUTOMATIC'
}

export enum AutomaticType {
    ORDER_TYPE = 'ORDER_TYPE',
    CUSTOMER = 'CUSTOMER',
    APP = 'APP'
}

export enum ApplicationTypes {
    ONLINE_ORDERING = 'ONLINE_ORDERING',
}

export const defaultValue: Readonly<IPricingPoint> = {};