import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';

export interface IFlyerVariantRef {
  id?: string | null;
  name?: string | null;
  sku?: string | null;
}

export interface IFlyerEntry {
  itemId?: string | null;
  variantId?: string | null;
  item?: IItem | null;
  variant?: IFlyerVariantRef | null;
}

export interface IFlyer {
  id?: string;
  name?: string;
  branch?: IBranch | null;
  startAt?: string | null;
  endAt?: string | null;
  price?: number | null;
  entries?: IFlyerEntry[];
}

export const defaultValue: Readonly<IFlyer> = {};
