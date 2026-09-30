import type { ICustomer } from './CUSTOMER/customer.model';

export interface ILoyaltyCardWallet {
    id?: string;
    balance?: number;
    assignedToId?: string;
    assignedTo?: ICustomer | null;
}

export interface ILoyaltyCard {
    id?: string;
    referenceNumber?: string;
    expiryDate?: Date;
    cardHolderName?: string;
    walletId?: string;
    wallet?: ILoyaltyCardWallet | null;
    loyaltyPointId?: string;
    createdByBranchId?: string;
    branchIds?: string[];
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
    branchIds: [],
    code: '',
    printed: false,
    active: true,
};
