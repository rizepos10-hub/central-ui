export interface IPosAuthorityGroup {
    name?: string;
    id?: string;
    description?: string;
    authorities?: POSAuthorityEnum[];
}

export enum POSAuthorityEnum {
    GIVE_DISCOUNT = 'GIVE_DISCOUNT',
    OPEN_DRAWER = 'OPEN_DRAWER',
    MAKE_VOID = 'MAKE_VOID',
    MAKE_REFUND = 'MAKE_REFUND',
    CHANGE_PRICE = 'CHANGE_PRICE',
    PAY_ON_ACCOUNT = 'PAY_ON_ACCOUNT',
    TRANSFER_TABLE = 'TRANSFER_TABLE',
    MOVE_TABLE = 'MOVE_TABLE',
    CHANGE_PAYMENT_TYPE = 'CHANGE_PAYMENT_TYPE',
    REPRINT_BILL = 'REPRINT_BILL',
    CLOSE_TILL = 'CLOSE_TILL',
    CLOSE_DAY = 'CLOSE_DAY',
    UNTAG_ORDER = 'UNTAG_ORDER',
    KDS_OPERATE = 'KDS_OPERATE',
    WAITER_READY_NOTIFY = 'WAITER_READY_NOTIFY',
    FORCE_REMOVE_ORDER = 'FORCE_REMOVE_ORDER'
}

export const defaultValue: Readonly<IPosAuthorityGroup> = {}