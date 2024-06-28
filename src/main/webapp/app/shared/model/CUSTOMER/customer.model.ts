
export interface ICustomer {
  id?: string;
  orderCount?: number | null;
  phone?: string;
  fax?: string;
  mobileNumber?: string;
  status?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: string;
  wholesalePriceLines?: IWholesalePriceLine
}

export interface IWholesalePriceLine {
  [key: string]: "PRICE_1" | "PRICE_2" | "PRICE_3"| "PRICE_4" | "PRICE_5";
}

export const defaultValue: Readonly<ICustomer> = {};
