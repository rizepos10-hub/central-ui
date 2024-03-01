import {IAddon} from "app/shared/model/ADDON/addon.model";

export interface IAddonGroup {
  id?: string;
  name?: string;
  addons?: IAddon[];
}

export const defaultValue: Readonly<IAddonGroup> = {};
