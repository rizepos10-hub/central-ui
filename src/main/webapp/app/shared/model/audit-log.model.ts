export interface IAuditLog {
  actor?: string;
  action?: "CREATED" | "UPDATED" | "DELETED";
  entityId?: string;
  entityType?: string;
  occurredAt?: string;
  changeLog?: string;
  changes?: IEntityPropertyChange[];
}

interface IEntityPropertyChange {
  changeType?: "ADDED" | "CHANGED" | "REMOVED" | "INITIALIZED" | "DELETED";
  propertyName?: string;
  value?: string;
  fromValue?: string;
  toValue?: string;
  affectedEntity?: string;
  itemChanges?: IEntityListItemChange[];
  propertyChanges?: IEntityMapEntryChange[];
}

interface IEntityListItemChange {
  changeType?: "ADDED" | "CHANGED" | "REMOVED" | "INITIALIZED" | "DELETED";
  index?: number;
  value?: string;
  fromValue?: string;
  toValue?: string;
  affectedEntity?: string;
}

interface IEntityMapEntryChange {
  changeType?: "ADDED" | "CHANGED" | "REMOVED" | "INITIALIZED" | "DELETED";
  propertyName?: string;
  value?: string;
  fromValue?: string;
  toValue?: string;
}

