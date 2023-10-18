export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export const defaultValue: Readonly<IAddress> = {};
