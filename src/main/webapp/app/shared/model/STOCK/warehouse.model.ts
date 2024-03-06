export interface IWarehouse {
  id?: string;
  name?: string;
  main?: boolean;
  location?: string;
  type?: "WAREHOUSE"
}

export const defaultValue: Readonly<IWarehouse> = {};
