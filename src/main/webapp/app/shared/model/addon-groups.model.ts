import {IAddon} from "app/shared/model/addon.model";

export interface IAddonGroups {
  id?: string;
  name?: string;
  addons?: IAddon[];
}

export const defaultValue: Readonly<IAddonGroups> = {};
