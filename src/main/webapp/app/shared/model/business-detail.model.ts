import { IAttachment } from 'app/shared/model/attachment.model';
import { IAddress } from 'app/shared/model/address.model';
import { DayOfWeek } from "app/shared/model/ENUMS/day-of-week.model";
import { EndingType } from './ENUMS/ending-type.model';
import { EndOfDayReportSection } from './ENUMS/end-of-day-report-section.model';
import { ISeo } from './ITEM/retail/product.model';
export interface IBusinessDayDetail {
  day: DayOfWeek;
  openingHours: { dayType: dayTypeEnum; from: string; to: string }[];
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
  printZeroPriceAddons?: boolean;
  deliveryConfiguration: IDeliveryConfiguration | null
  phone?: string;
  paymentConfigurations?: IPaymentConfigurations[];
  endOfDayReportSection?: EndOfDayReportSection[];
  activeCOD?: boolean;
  hideRetailShop?: boolean;
  hideMapOnOnlineOrdering?: boolean;
  hideOpeningHoursOnOnlineOrdering?: boolean;
  unitCostCalculationMode?: UnitCostCalculationMode;
  endingType?: EndingType;
  tokenExpired?: boolean;
  logo?: IAttachment;
  ebteligible?: boolean;
  enableAskOnTablePermissions?: boolean;
  pages?: ISeoPages
  timeZone?: string;
}

export interface ISeoPages {
  home: ISeo;
  retail: ISeo;
  restaurant: ISeo;
}

export enum UnitCostCalculationMode {
  AVERAGE = 'AVERAGE',
  MAX = 'MAX',
}

export enum dayTypeEnum {
  TODAY = 'TODAY',
  NEXT_DAY = 'NEXT_DAY',
}

export interface IDeliveryConfiguration {
  chargePerDistance: {
    distance: IDistance,
    charge: number;
  };
  shipmentRange: IDistance;
  minCharge: number;
  pricingMode?: DeliveryPricingMode;
  /** Order subtotal ≥ this amount → delivery fee is zero (same as central `DELIVERY_PRICING`). Omit or clear to disable. */
  freeOnAmount?: number | null;
  definedChargeRules: IChargeRule[];
  zoneChargeRules: IZoneChargeRule[];
  deliveryTaggingMode: DeliveryTaggingModeEnum;
  defaultBookingLeadMinutes?: number | null;
  tookanBookingTaskSteps?: ITookanBookingTaskSteps | null;
}

export enum DeliveryPricingMode {
  COVERAGE_BASE = 'COVERAGE_BASE',
  DISTANCE_BAND_RULE = 'DISTANCE_BAND_RULE',
  ZONE_RULE = 'ZONE_RULE',
}

export enum DeliveryTaggingModeEnum {
  RESTRICTED = 'RESTRICTED',
  UNRESTRICTED = 'UNRESTRICTED',
}

export interface ITookanBookingTaskSteps {
  goingToRestaurantEnabled: boolean;
  pickedUpPackageEnabled: boolean;
  deliveredToCustomerEnabled: boolean;
}

export interface IChargeRule {
  minDistance: IDistance;
  maxDistance: IDistance;
  orderAmount: number;
  charge: number;
}

export interface IZoneChargeRule {
  zoneId: string;
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
