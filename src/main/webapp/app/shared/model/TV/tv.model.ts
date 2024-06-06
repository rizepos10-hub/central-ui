import {IBranch} from "app/shared/model/branch.model";
import {ITvDisplay} from "app/shared/model/TV/tv-display.model";
import { IAttachment } from "../attachment.model";

export interface IDimension {
  height: number;
  width: number;
}

export interface ITv {
  id?: string;
  dimensions?: IDimension;
  name?: string;
  branch?: IBranch;
  tvDisplay?: ITvDisplay;
  attachments?: IAttachment[];
}

export const defaultValue: Readonly <ITv> = {
  name: '',
  branch: null,
  dimensions: null,
  tvDisplay: null
};
