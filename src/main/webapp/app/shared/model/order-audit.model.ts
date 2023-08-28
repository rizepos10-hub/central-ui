export interface IOrderAudit {
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  isArchived?: string;
}

export const defaultValue: Readonly<IOrderAudit> = {};
