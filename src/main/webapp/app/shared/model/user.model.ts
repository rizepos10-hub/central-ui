import { IBranch } from "./branch.model";
import { IPosAuthorityGroup, POSAuthorityEnum } from "./pos-authority-group";

export interface IUser {
  phone?: string;
  id?: any;
  login?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  activated?: boolean;
  langKey?: string;
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string;
  lastModifiedDate?: Date | null;
  password?: string;
  permissions?: any[];
  isActive?: boolean;
  roles?: RolePermissions;
  username?: string;
  authorities?: POSAuthorityEnum[];
  authoritiesGroups?: IPosAuthorityGroup[];
  branches?: IBranch[];
  userName?: string;
  verified?: boolean;
  pinCode?: string;
  enabled?: boolean;
}

interface Authority {
  authorityName?: string;
  assigned?: boolean;
}

interface Group {
  groupName?: string;
  authorities?: Authority[];
}

export interface RolePermissions {
  groups: Group[];
  authorities: Authority[];
}

export interface AvailableRoles {
  id?: string;
  name?: string;

  description: string;
}

export const defaultValue: Readonly<IUser> = {};
