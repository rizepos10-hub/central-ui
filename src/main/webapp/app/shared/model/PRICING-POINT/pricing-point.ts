import { IBranch } from '../branch.model';
import { IDiscount } from '../discount.model';
import { DiscountType } from '../ENUMS/discount-type.model';
import { OrderMethod } from '../ENUMS/order-method.model';

export interface IPricingPoint {
    id?: string;
    name?: string;
    type?: PricingPointType;
    automaticType?: AutomaticType;
    orderTypes?: OrderMethod[];
    applicableBranches?: IBranch[]
    applicationTypes?: ApplicationTypes[];
    /** Percentage or flat amount. When set, the branch uses it instead of this point's fixed item prices. */
    discount?: IDiscount | null;
}

/** "20%" or "Flat 5". Empty when the point has no usable discount. */
export const pricingPointDiscountLabel = (discount?: IDiscount | null): string => {
    if (!discount?.type || discount.value == null || discount.value === 0) return '';
    return discount.type === DiscountType.PERCENTAGE ? `${discount.value}%` : `Flat ${discount.value}`;
};

/** A non-zero discount is applied to every item on the order, so the point has no per-item price. */
export const pricingPointHasDiscount = (point?: Pick<IPricingPoint, 'discount'> | null): boolean =>
    pricingPointDiscountLabel(point?.discount) !== '';

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