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
  onAccountBalanceType?: OnAccountBalanceType | null;
  branchOnAccountDebits?: IBranchOnAccountDebitMap;
  phone?: string;
  fax?: string;
  deliveryAddresses?: IAddress[];
  mobileNumber?: string;
  status?: string | null;
  firstName?: string;
  lastName?: string;
  loyaltyCard?: ILoyaltyCard | null;
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
