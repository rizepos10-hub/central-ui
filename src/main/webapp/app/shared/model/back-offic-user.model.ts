import { IBranch } from "./branch.model";
import { IUser } from "./user.model";

export interface IBackOfficeUser {
    user: IUser;
    branches: IBranch[];
}

export const defaultValue: Readonly<IBackOfficeUser> = {
    user: {
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
    },
    branches: []
};