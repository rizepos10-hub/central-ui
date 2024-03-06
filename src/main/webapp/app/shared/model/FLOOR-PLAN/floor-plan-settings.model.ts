import {IAttachment} from "app/shared/model/attachment.model";

export interface IFloorPlanSettings {
  sectionDimensions?: {
    width: number;
    height: number;
  } | null;
  tableDimensions?:  {
    width: number;
    height: number;
  } | null;
  tableImage?: IAttachment;
  sectionBackground?: IAttachment;
}

export const defaultValue: Readonly<IFloorPlanSettings> = {};



