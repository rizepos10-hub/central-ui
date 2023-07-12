import { IItem } from 'app/shared/model/item.model';
import { AttachmentType } from 'app/shared/model/enumerations/attachment-type.model';

export interface IAttachment {
  id?: string;
  name?: string;
  path?: string;
  size?: number;
  type?: AttachmentType;
  item?: IItem | null;
}

export const defaultValue: Readonly<IAttachment> = {};
