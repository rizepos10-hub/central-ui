import { IAttachment } from 'app/shared/model/attachment.model';
import { IAddon } from 'app/shared/model/addon.model';
import { IMenu } from 'app/shared/model/menu.model';
import { ItemStatus } from 'app/shared/model/enumerations/item-status.model';

export interface IItem {
  id?: string;
  name?: string;
  desc?: string | null;
  orderCount?: number | null;
  avgRating?: number | null;
  ratingCount?: number | null;
  stock?: number;
  status?: ItemStatus | null;
  attachments?: IAttachment[] | null;
  addons?: IAddon[] | null;
  menu?: IMenu | null;
}

export const defaultValue: Readonly<IItem> = {};
