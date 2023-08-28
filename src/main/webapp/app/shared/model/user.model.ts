export interface IUser {
  phone?:string;
  id?: any;
  login?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  activated?: boolean;
  langKey?: string;
  authorities?: any[];
  createdBy?: string;
  createdDate?: Date | null;
  lastModifiedBy?: string;
  lastModifiedDate?: Date | null;
  password?: string;
  permissions?: any[];
  isActive?: boolean;
  username?: string ;
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
};
