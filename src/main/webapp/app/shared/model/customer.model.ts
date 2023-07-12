export interface ICustomer {
  id?: string;
  orderCount?: number | null;
  phone?: string;
  status?: string | null;
}

export const defaultValue: Readonly<ICustomer> = {};
