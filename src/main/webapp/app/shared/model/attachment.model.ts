import { IItem } from 'app/shared/model/ITEM/item.model';
import { AttachmentType } from 'app/shared/model/ENUMS/attachment-type.model';

export interface IAttachment {
  id?: string;
  name?: string;
  path?: string;
  size?: number;
  type?: AttachmentType;
  item?: IItem | null;
  url?: string | null;
}

export const defaultValue: Readonly<IAttachment> = {};
