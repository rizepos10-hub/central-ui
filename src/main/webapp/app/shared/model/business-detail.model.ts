import { IAttachment } from 'app/shared/model/attachment.model';
import { IAddress } from 'app/shared/model/address.model';
import { DayOfWeek } from "app/shared/model/ENUMS/day-of-week.model";
import { IZone } from './ZONE/zone.model';
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
  paymentConfigurations?: IPaymentConfigurations[];
  activeCOD?: boolean;
  zones: IZone[];
  hideRetailShop?: boolean;
  unitCostCalculationMode?: UnitCostCalculationMode;
}

export enum UnitCostCalculationMode {
  AVERAGE = 'AVERAGE',
  MAX = 'MAX',
}

export interface IDeliveryConfiguration {
  chargePerDistance: {
    distance: IDistance,
    charge: number;
  };
  shipmentRange: IDistance;
  minCharge: number;
  definedChargeRules: IChargeRule[];
}

export interface IChargeRule {
  minDistance: IDistance;
  maxDistance: IDistance;
  orderAmount: number;
  charge: number;
}

export interface IDistance {
  value: number;
  metric: Metric;
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

export interface IPaymentConfigurations {
  active: boolean;
  defaultSelected: boolean;
  environment: "TEST" | "PROD";
  gateway?: string;
  moduleCode?: string;
  integrationKeys?: IIntegrationKey;
}

export interface IIntegrationKey {
  apiUrl?: string;
  lightboxUrl?: string;
  sslAddToken?: string;
  sslGetToken?: string;
  sslMerchantId?: string;
  sslPin?: string;
  sslTransactionType?: string;
  sslUserId?: string;
}
export const defaultValue: Readonly<IBusinessDetail> = {
  id: null,
  businessName: null,
  logo: null,
  slogan: null,
  address: null,
  businessDetails: [],
};
