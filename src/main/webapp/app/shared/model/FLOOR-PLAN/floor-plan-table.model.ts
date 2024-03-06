import {IBranch} from "app/shared/model/branch.model";
import {IAttachment} from "app/shared/model/attachment.model";

export interface IFloorPlanTable {
  id?: string;
  name?: string;
  dimensions?: {
    width: number;
    height: number;
  } | null;
  branch?: IBranch;
  image?: IAttachment;
}

export const defaultValue: Readonly<IFloorPlanTable> = {};
