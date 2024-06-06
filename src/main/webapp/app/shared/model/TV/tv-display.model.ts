import {IDimension} from "app/shared/model/TV/tv.model";
import { IAttachment } from "../attachment.model";


interface IPosition {
  x: number;
  y: number;
}

export interface IDisplaySubScreen {
  position: IPosition;
  dimensions: IDimension;
  durationInMilliseconds: number;
}

export interface ITvDisplay {
  id?: string;
  dimensions?:IDimension;
  name?: string;
  subScreens?: IDisplaySubScreen[];
  attachments?: IAttachment[];
}

export const defaultValue: Readonly<ITvDisplay> = {};
