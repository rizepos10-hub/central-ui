import { IBranch } from './branch.model';

export interface IServiceCharge {
  id?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  branch?: IBranch;
  key?: ServiceChargeKey;
  value?: IServiceChargeValue;
}

export enum ServiceChargeKey {
  SHIPPING_FEE = "SHIPPING_FEE",
  WRAPPING_FEE = "WRAPPING_FEE",
  GRATUITY = "GRATUITY"
}

export interface IServiceChargeValue {
  key?: ServiceChargeType;
  name?: string;
  setting?: IServiceChargeSetting;
  whenToApply?: ServiceChargeWhenToApply;
  minCharge?: number;
  maxCharge?: number;
  charge?: number;
}

export interface IServiceChargeSetting {
  type?: ServiceChargeSettingType;
  applicableOn?: ServiceChargeApplicableOn[];
}

export enum ServiceChargeApplicableOn {
  DELIVERY = "DELIVERY",
  PICKUP = "PICKUP"
}

export enum ServiceChargeType {
  SHIPPING_FEE = "SHIPPING_FEE"
}

export enum ServiceChargeSettingType {
  FIXED = "FIXED"
}

export enum ServiceChargeWhenToApply {
  AUTOMATIC = "AUTOMATIC",
  ON_DEMAND = "ON_DEMAND"
}


export const defaultValue: Readonly<IServiceCharge> = {};