export interface IWarehouse {
  id?: string;
  name?: string;
  main?: boolean;
  location?: string;
}

export const defaultValue: Readonly<IWarehouse> = {};
