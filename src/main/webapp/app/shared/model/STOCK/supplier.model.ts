export interface ISupplier {
  id?: string;
  name?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}


export const defaultValue: Readonly<ISupplier> = {};
