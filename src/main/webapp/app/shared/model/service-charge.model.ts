import { IBranch } from './branch.model';
import { SourceType } from './ENUMS/source-type.model';
import { IPaymentMethodSetting } from './payment-method-setting.model';
import { IProfileGroup } from './TAX/profile-group.model';

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
  accountingGroup?: IProfileGroup
}

export enum ServiceChargeKey {
  SHIPPING_FEE = "SHIPPING_FEE",
  WRAPPING_FEE = "WRAPPING_FEE",
  GRATUITY = "GRATUITY",
  OTHER = "OTHER"
}

export interface IServiceChargeSetting {
  method?: ServiceChargeCalculationMethod;
  applicableOn?: ServiceChargeApplicableOn;
  discountable?: boolean;
  loyaltyEligible?: boolean;
}

export interface ServiceChargeApplicableOn {
  orderMethods?: ServiceChargeOrderMethod[];
  transactionMethods?: IPaymentMethodSetting[];
  orderSources?: SourceType[];
}

export enum ServiceChargeOrderMethod {
  DELIVERY = "DELIVERY",
  PICKUP = "PICKUP",
  DINE_IN = "DINE_IN",
  WALK_IN = "WALK_IN"
}

export enum TransactionMethodEnum {
  cash = "cash",
  debit = "debit",
  loyalty = "loyalty",
  storeCredit = "storeCredit",
  visa = "visa",
  master = "master",
  amex = "amex",
  giftCard = "giftCard",
  coupon = "coupon",
  creditCard = "creditCard",
  chinaUnionPay = "chinaUnionPay",
  discover = "discover",
  japanCreditBureau = "japanCreditBureau",
  electronicBenefitTransferCashBenefit = "electronicBenefitTransferCashBenefit",
  electronicBenefitTransferFoodStamp = "electronicBenefitTransferFoodStamp",
  custom = "custom",
  convergeLightbox = "convergeLightbox",
}

export enum ServiceChargeCalculationMethod {
  FIXED = "FIXED",
  PERCENTAGE = "PERCENTAGE"
}

export enum ServiceChargeWhenToApply {
  AUTOMATIC = "AUTOMATIC",
  ON_DEMAND = "ON_DEMAND"
}

export const defaultValue: Readonly<IServiceCharge> = {};