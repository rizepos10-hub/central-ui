export type RegisterTillStatus = 'OPENED' | 'CLOSE_REQUESTED' | 'CLOSED';

export interface IOpenTill {
  registryId?: string;
  branchId?: string;
  tillId?: string;
  name?: string;
  status?: RegisterTillStatus;
}

export const defaultValue: Readonly<IOpenTill> = {};
