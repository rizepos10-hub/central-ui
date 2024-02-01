export interface IWareHouse {
  id?: string;
  name?: string;
  main?: boolean;
  location?: string;
  branchId?: string;
}

export const defaultValue: Readonly<IWareHouse> = {};
