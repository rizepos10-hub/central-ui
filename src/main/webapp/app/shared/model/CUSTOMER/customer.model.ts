import { ILoyaltyCard } from "../loyalty-card.model";
import { IAddress } from "../address.model";

export interface ICustomer {
  id?: string;
  orderCount?: number | null;
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
  wholesalePriceLines?: IWholesalePriceLine;
  businessDetails?: {
    businessName: string;
  }
}

export interface IWholesalePriceLine {
  [key: string]: "PRICE_1" | "PRICE_2" | "PRICE_3" | "PRICE_4" | "PRICE_5";
}

export const defaultValue: Readonly<ICustomer> = {};
