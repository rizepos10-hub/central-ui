export interface IAddress {
  id?: string;
  tempId?: string;
  contactPersonName?: string;
  addressType?: AddressTypeEnum;
  street?: string;
  city?: string;
  state?: string;
  floor?: string;
  country?: string;
  postalCode?: string;
  fullAddress?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  email?: string;
  phoneNumber?: string;
}

export enum AddressTypeEnum {
  Home = "Home",
  Office = "Office",
  Other = "Other"
}

export const defaultValue: Readonly<IAddress> = {
  addressType: AddressTypeEnum.Home
};
