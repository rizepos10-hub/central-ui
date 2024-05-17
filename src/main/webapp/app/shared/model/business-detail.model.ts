import { IAttachment } from 'app/shared/model/attachment.model';
import { IAddress } from 'app/shared/model/address.model';
import { DayOfWeek } from "app/shared/model/ENUMS/day-of-week.model";
export interface IBusinessDayDetail {
  day: DayOfWeek;
  openingHours: { from: string; to: string }[];
  opensToday: boolean;
  status: string;
  shifts: IShifts[];
}

export interface IShifts {
  shiftName: string,
  from: string
  to: string
  users: []
}

export interface IBusinessDetail {
  id?: string;
  businessName?: string;
  logo?: IAttachment;
  slogan?: string;
  address?: IAddress;
  businessDetails?: businessDayDetails[];
  branchDetails?: IBranchDetails[];
}

export interface IBranchDetails {
  branchId: string;
  name: string;
  address: IAddress;
  days: IBusinessDayDetail[];
  wholesale: boolean;
  deliveryConfiguration: IDeliveryConfiguration | null
  phone?: string;
}

export interface IDeliveryConfiguration {
  chargePerDistance: {
    distance: {
      value: number;
      metric: Metric;
    },
    charge: number;
  };
  shipmentRange: {
    value: number;
    metric: Metric;
  };
  minCharge: number;
}

export enum Metric {
  KILOMETERS = 'KILOMETERS',
  MILES = 'MILES',
  NEUTRAL = 'NEUTRAL',
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
