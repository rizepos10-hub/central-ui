export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress?: string;
  longitude?: number;
  latitude?: number;
}

export const defaultValue: Readonly<IAddress> = {};
