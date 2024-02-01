import { IAttachment } from 'app/shared/model/attachment.model';
import { IAddress } from 'app/shared/model/address.model';
import {DayOfWeek} from "app/shared/model/ENUMS/day-of-week.model";
export interface IBusinessDayDetail {
  day: DayOfWeek;
  openingHours: { from: string; to: string }[];
  opensToday: boolean;
  status: string;
}

export interface IBusinessDetail {
  id?: string;
  businessName?: string;
  logo?: IAttachment;
  slogan?: string;
  address?: IAddress;
  businessDetails?: businessDayDetails[];
}

export interface businessDayDetails {
  days: IBusinessDayDetail[];
  branchId: string;
  address: IAddress;
}
export const defaultValue: Readonly<IBusinessDetail> = {
  id: null,
  businessName: null,
  logo: null,
  slogan: null,
  address: null,
  businessDetails: [],
};
