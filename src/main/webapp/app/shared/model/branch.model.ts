import { IMenu } from 'app/shared/model/menu.model';

export interface IBranch {
  id?: string;
  name?: string;
  appId?: string | null;
  numberOfEmployees?: number | null;
  menu?: IMenu | null;
}

export const defaultValue: Readonly<IBranch> = {};
