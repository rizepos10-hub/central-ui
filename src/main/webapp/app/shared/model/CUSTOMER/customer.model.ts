export interface ICustomer {
  id?: string;
  orderCount?: number | null;
  phone?: string;
  status?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  image?: string;
}

export const defaultValue: Readonly<ICustomer> = {};
