
export interface ITimeRange {
  from: string;
  to: string;
}

export interface ISchedule {
  [day: string]: ITimeRange[];
}

export interface IVisibility {
  visible?: boolean | null;
  schedule?: ISchedule;
}

export const defaultValue: Readonly<IVisibility> = {};
