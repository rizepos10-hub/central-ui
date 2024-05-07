export interface IUser {
  phone?:string;
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
  username?: string ;
  authorities?: any[];
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

description:string;
}

export const defaultValue: Readonly<IUser> = {
  login: '',
  firstName: '',
  lastName: '',
  email: '',
  activated: true,
  langKey: '',
  authorities: [],
  createdBy: '',
  createdDate: null,
  lastModifiedBy: '',
  lastModifiedDate: null,
  password: '',
  username: '',
  roles: {
    groups: [],
    authorities: [],
  },
};
