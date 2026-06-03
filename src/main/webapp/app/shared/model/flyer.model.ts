import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { SourceType } from 'app/shared/model/ENUMS/source-type.model';
import { ISchedule } from 'app/shared/model/visibility.model';

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
  price?: number | null;
}

export interface IFlyerSchedule {
  startAt?: string | null;
  endAt?: string | null;
  application?: SourceType | null;
  schedule?: ISchedule | null;
}

export interface IFlyer {
  id?: string;
  name?: string;
  branch?: IBranch | null;
  schedule?: IFlyerSchedule | null;
  entries?: IFlyerEntry[];
}

export const defaultValue: Readonly<IFlyer> = {};
