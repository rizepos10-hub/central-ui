import {IBranch} from "app/shared/model/branch.model";
import {ITvDisplay} from "app/shared/model/TV/tv-display.model";
import { IAttachment } from "../attachment.model";
import { IRegularItem } from "../ITEM/restaurant/regular-item.model";

export interface IDimension {
  height: number;
  width: number;
}

export interface ICarouselItemElement {
  id: string;
  type: 'text' | 'image';
  documentType: 'ITEM';
  documentId: string;
  fieldToQuery: string;
  content: string;
  position: {
    x: number; // percentage
    y: number; // percentage
  };
  size: {
    width: number; // percentage
    height: number; // percentage
  };
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    textAlign?: string;
  };
  locked?: boolean;
}

export interface ICarouselPage {
  id: string;
  name: string;
  selectedItem?: IRegularItem;
  elements: ICarouselItemElement[];
  duration?: number; // in seconds
}

export interface ITv {
  id?: string;
  dimensions?: IDimension;
  name?: string;
  branch?: IBranch;
  tvDisplay?: ITvDisplay;
  attachments?: IAttachment[];
  carouselPages?: ICarouselPage[];
}

export const defaultValue: Readonly <ITv> = {
  name: '',
  branch: null,
  dimensions: { width: 1920, height: 1080 },
  tvDisplay: null,
  carouselPages: []
};
