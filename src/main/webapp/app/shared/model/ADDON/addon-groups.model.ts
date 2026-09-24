import { IAddon } from "app/shared/model/ADDON/addon.model";
import { IAddonPriceOverride } from "./addon-price-override";

export interface IAddonGroup {
  id?: string;
  name?: string;
  addons?: IAddon[];
  addonOptionsVisibility?: 'SHOW' | 'HIDDEN' | null;
}

export interface IAddonGroups {
  addonGroup?: IAddonGroup;
  addonPriceOverrides?: IAddonPriceOverride[];
  excluded?: IAddon[];
  maxQuantity?: number;
  minQuantity?: number;
  name?: string;
  required?: boolean;
  addAutomatically?: boolean;
  rootAddonGroup?: boolean;
}

export const defaultValue: Readonly<IAddonGroup> = {};
