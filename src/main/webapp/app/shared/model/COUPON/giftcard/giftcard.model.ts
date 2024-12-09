import { Coupon } from "../coupon.model";

export interface GiftCard extends Coupon {
    assignedCustomer?: string;
    fromCustomer?: string;
    applied?: boolean;
    email?: string;
}

export const defaultValue: Readonly<GiftCard> = {};