import { IBranch } from './branch.model';

export interface IServiceCharge {
  id?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  branches?: IBranch[];
  key?: ServiceChargeKey;
  name?: string;
  setting?: IServiceChargeSetting;
  whenToApply?: ServiceChargeWhenToApply;
  charge?: number;
  isArchived?: boolean;
}

export enum ServiceChargeKey {
  SHIPPING_FEE = "SHIPPING_FEE",
  WRAPPING_FEE = "WRAPPING_FEE",
  GRATUITY = "GRATUITY",
  OTHER = "OTHER"
}

export interface IServiceChargeSetting {
  type?: ServiceChargeSettingType;
  applicableOn?: ServiceChargeApplicableOn[];
}

export enum ServiceChargeApplicableOn {
  DELIVERY = "DELIVERY",
  PICKUP = "PICKUP",
  DINE_IN = "DINE_IN",
  WALK_IN = "WALK_IN"
}

export enum ServiceChargeSettingType {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE"
}

export enum ServiceChargeWhenToApply {
  AUTOMATIC = "AUTOMATIC",
  ON_DEMAND = "ON_DEMAND"
}

export const defaultValue: Readonly<IServiceCharge> = {};