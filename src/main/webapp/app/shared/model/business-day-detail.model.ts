import { DayOfWeek } from 'app/shared/model/ENUMS/day-of-week.model';
import { IOpeningHour } from 'app/shared/model/opening-hour.model';

export interface IBusinessDayDetail {
  day?: DayOfWeek;
  openingHours?: IOpeningHour[];
}
export const defaultValue: Readonly<IBusinessDayDetail> = {};
