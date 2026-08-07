import { ILoyaltyCard } from "../loyalty-card.model";
import { IAddress } from "../address.model";
import { IPricingPoint } from "../PRICING-POINT/pricing-point";
import { IBranchOnAccountDebitMap, OnAccountBalanceType } from '../on-account-settings.model';

export type { IBranchOnAccountDebit, IBranchOnAccountDebitMap } from '../on-account-settings.model';
export { OnAccountBalanceType } from '../on-account-settings.model';

export interface ICustomer {
  id?: string;
  orderCount?: number | null;
  onAccountDebitLimit?: number | null;
  onAccountDebitUsed?: number | null;
  onAccountEnabled?: boolean | null;
  unlimitedOnAccount?: boolean | null;
  onAccountBalanceType?: OnAccountBalanceType | null;
  branchOnAccountDebits?: IBranchOnAccountDebitMap;
  phone?: string;
  fax?: string;
  deliveryAddresses?: IAddress[];
  mobileNumber?: string;
  status?: string | null;
  accountNumber?: string;
  firstName?: string;
  lastName?: string;
  loyaltyCards?: ILoyaltyCard[] | null;
  loyaltyPointsRemaining?: number | null;
  email?: string;
  image?: string;
  pricingPoints?: IPricingPointsMap;
  businessDetails?: {
    businessName: string;
  }
}

export interface IPricingPointsMap {
  [key: string]: IPricingPoint;
}

export interface IWholesalePriceLine {
  [key: string]: "PRICE_1" | "PRICE_2" | "PRICE_3" | "PRICE_4" | "PRICE_5";
}

export const defaultValue: Readonly<ICustomer> = {};
