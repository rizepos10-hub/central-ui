export interface IVoidReason{
  id?: string;
  code?: string;
  reason?: string | null;
}

export const defaultValue: Readonly<IVoidReason> = {};
