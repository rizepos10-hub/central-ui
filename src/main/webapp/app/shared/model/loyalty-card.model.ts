export interface ILoyaltyCard {
    id?: string;
    referenceNumber?: string;
    expiryDate?: Date;
    cardHolderName?: string;
    walletId?: string;
    loyaltyPointId?: string;
    createdByBranchId?: string;
    code?: string;
    printed?: boolean;
    active?: boolean;
}

export interface ILoyaltyCardBalance {
    amount: number;
    paymentType: PaymentType;
}

export enum PaymentType {
    CONVERGE = 'CONVERGE',
    CREDITCARD = 'CREDITCARD',
    CASH = 'CASH',
}

export const defaultValue: Readonly<ILoyaltyCard> = {
    referenceNumber: '',
    expiryDate: null,
    cardHolderName: '',
    walletId: '',
    loyaltyPointId: '',
    createdByBranchId: '',
    code: '',
    printed: false,
    active: true,
};