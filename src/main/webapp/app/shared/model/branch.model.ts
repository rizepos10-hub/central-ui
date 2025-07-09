import { IMenu } from 'app/shared/model/menu.model';

export interface IBranch {
  id?: string;
  name?: string;
  appId?: string | null;
  wholesale?: boolean
  numberOfEmployees?: number | null;
  menu?: IMenu | null;
  ebtEligible?: boolean;
}

export const defaultValue: Readonly<IBranch> = {};
