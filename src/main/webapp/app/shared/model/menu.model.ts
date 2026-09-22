import dayjs from 'dayjs';
import { ITerm } from 'app/shared/model/term.model';
import { IBranch } from 'app/shared/model/branch.model';
import { IItem } from 'app/shared/model/ITEM/item.model';
import { IVisibility } from "app/shared/model/visibility.model";
import { IAttachment } from './attachment.model';

export interface IMenu {
  id?: string;
  name?: string;
  createdDate?: string,
  lastModifiedDate?: string,
  category?: ITerm;
  branches?: IBranch[] | null;
  items?: IItem[];
  menuScreens?: IMenuScreen[];
  excludedItems?: IItem[];
  itemType?: "RETAIL" | "RESTAURANT" | null;
  visibilities?: IVisibility[];
  type?: "POS" | "ONLINE_ORDERING";
  numberOfColumns?: number;
  rowHeight?: number[];
  image?: IAttachment;
}

export interface IFontProperties {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

export interface IMenuScreen {
  id?: string;
  name?: string;
  description?: string;
  backgroundColor?: string;
  managerOnlyAccess?: boolean;
  componentType?: "SUB_SCREENS" | "ITEM" | "POS";
  allowMultiButtonSelect?: boolean;
  numberOfColumns?: number;
  isDefault?: boolean;
  rowHeight?: number[];
  subScreens?: IMenuScreen[];
  rowIndex?: number;
  empty?: boolean;
  isPizza?: boolean;
  attachment?: IAttachment;
  fontProperties?: IFontProperties | null;
  component?: {
    item?: IItem | null;
    itemId?: string | null;
  }
}

export const defaultValue: Readonly<IMenu> = {};
