import {SourceType} from "app/shared/model/ENUMS/source-type.model";

export interface ITimeRange {
  from: string;
  to: string;
}

export interface ISchedule {
  [day: string]: ITimeRange[];
}

export interface IVisibility {
  application?: SourceType;
  visible?: boolean | null;
  schedule?: ISchedule | null;
}

export const defaultValue: Readonly<IVisibility> = {};
