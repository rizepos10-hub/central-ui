/** Mirrors central `DeliveryTaggingMode` (Tookan delivery configuration only; Icabbi uses separate settings/API). */
export type DeliveryTaggingMode = 'RESTRICTED' | 'UNRESTRICTED';

/** Mirrors `SubtotalCondition.ComparisonOperator`. */
export type SubtotalComparisonOperator = 'EQUALS' | 'LESS_THAN' | 'GREATER_THAN';

export interface IDistance {
  value?: number;
  /** Spring `Metrics` enum; optional — distance value in km is what the server uses for Tookan bands. */
  metric?: string;
}

export interface IDistanceCharge {
  distance?: IDistance;
  charge?: number;
}

export interface IDefinedChargeRule {
  minDistance?: IDistance;
  maxDistance?: IDistance;
  orderAmount?: number;
  charge?: number;
}

export interface IDeliveryConfiguration {
  definedChargeRules?: IDefinedChargeRule[];
  deliveryTaggingMode?: DeliveryTaggingMode;
  chargePerDistance?: IDistanceCharge;
  shipmentRange?: IDistance;
  minCharge?: number;
  freeOnAmount?: number;
}

export interface ISubtotalCondition {
  subTotal?: number;
  comparisonOperator?: SubtotalComparisonOperator;
}

export interface IPercentageOnCondition {
  percentCharge?: number;
  maxCharge?: number;
  subtotalCondition?: ISubtotalCondition;
}

export interface IFlatOnCondition {
  amountCharge?: number;
  subtotalCondition?: ISubtotalCondition;
}

export interface IChargeCalculationSetting {
  percentageOnCondition?: IPercentageOnCondition;
  flatOnCondition?: IFlatOnCondition;
  /** Extra free-delivery threshold for Tookan (order subtotal ≥ this → $0 delivery from provider rules). */
  orderWithAmount?: number;
  /** Accounting group id for tax on the platform service fee line. */
  platformFeeTaxAccountingGroupId?: string | null;
}

export interface ITookanSettingValue {
  active?: boolean;
  apiKey?: string;
  webhookSharedSecret?: string;
  teamId?: number;
  autoAssignment?: boolean;
  notify?: boolean;
  geofence?: boolean;
  trackingLink?: boolean;
  deliveryConfiguration?: IDeliveryConfiguration;
  chargeCalculationSetting?: IChargeCalculationSetting;
}

export interface ITookanSettingRequest {
  branchId?: string;
  value?: ITookanSettingValue;
}

export interface ITookanSettingResponse {
  branchId?: string;
  hasApiKey?: boolean;
  hasWebhookSecret?: boolean;
  value?: ITookanSettingValue;
}

export const defaultDeliveryConfiguration: Readonly<IDeliveryConfiguration> = {
  definedChargeRules: [],
  deliveryTaggingMode: 'UNRESTRICTED',
  chargePerDistance: undefined,
  shipmentRange: undefined,
  minCharge: undefined,
  freeOnAmount: undefined,
};

export const defaultTookanSettingValue: Readonly<ITookanSettingValue> = {
  active: false,
  autoAssignment: false,
  notify: true,
  geofence: false,
  trackingLink: true,
  deliveryConfiguration: { ...defaultDeliveryConfiguration, definedChargeRules: [] },
  chargeCalculationSetting: {},
};

export const defaultTookanSettingResponse: Readonly<ITookanSettingResponse> = {
  value: defaultTookanSettingValue,
  hasApiKey: false,
  hasWebhookSecret: false,
};

function normalizeDeliveryConfiguration(dc?: IDeliveryConfiguration | null): IDeliveryConfiguration {
  const rules = dc?.definedChargeRules;
  return {
    ...defaultDeliveryConfiguration,
    ...(dc || {}),
    definedChargeRules: Array.isArray(rules) ? rules.map(r => ({ ...r })) : [],
    deliveryTaggingMode: dc?.deliveryTaggingMode ?? 'UNRESTRICTED',
  };
}

function normalizeChargeCalculationSetting(ccs?: IChargeCalculationSetting | null): IChargeCalculationSetting {
  if (!ccs || Object.keys(ccs).length === 0) {
    return {};
  }
  return {
    ...ccs,
    percentageOnCondition: ccs.percentageOnCondition ? { ...ccs.percentageOnCondition } : undefined,
    flatOnCondition: ccs.flatOnCondition ? { ...ccs.flatOnCondition } : undefined,
  };
}

export function normalizeTookanSettingValue(value?: ITookanSettingValue | null): ITookanSettingValue {
  return {
    ...defaultTookanSettingValue,
    ...(value || {}),
    deliveryConfiguration: normalizeDeliveryConfiguration(value?.deliveryConfiguration),
    chargeCalculationSetting: normalizeChargeCalculationSetting(value?.chargeCalculationSetting),
  };
}
