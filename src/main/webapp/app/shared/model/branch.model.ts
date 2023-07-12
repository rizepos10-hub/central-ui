import { IMenu } from 'app/shared/model/menu.model';

export interface IBranch {
  id?: string;
  name?: string;
  numberOfEmployees?: number | null;
  menu?: IMenu | null;
}

export const defaultValue: Readonly<IBranch> = {};
