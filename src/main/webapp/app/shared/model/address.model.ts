export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress?: string;
  longitude?: number;
  latitude?: number;
  email?: string;
  phoneNumber?: string;
}

export const defaultValue: Readonly<IAddress> = {};
