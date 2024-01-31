import {IBranch} from "app/shared/model/branch.model";
import {ITvDisplay} from "app/shared/model/TV/tv-display.model";

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
}

export const defaultValue: Readonly <ITv> = {};
