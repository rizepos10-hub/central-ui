export interface ICurrency {
  id?: string;
  code?: string;
  name?: string;
  decimals?: number,
  isoNumber?: number,
  hidden?: boolean,
}

export const defaultValue: Readonly<ICurrency> = {};
