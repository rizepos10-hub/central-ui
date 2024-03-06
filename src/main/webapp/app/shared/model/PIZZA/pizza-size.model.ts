import {DayOfWeek} from "app/shared/model/ENUMS/day-of-week.model";
import {IVisibility} from "app/shared/model/visibility.model";

export interface IPizzaSize {
  id?: string;
  name?: string;
  order?: number;
  visibility?: IVisibility
}

export const defaultValue: Readonly<IPizzaSize> = {};
