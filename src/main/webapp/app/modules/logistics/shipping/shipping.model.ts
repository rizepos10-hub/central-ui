export type ShippingSource = 'EASYPOST' | 'CLICKSHIP' | 'RATE_TABLE';
export type ShippingProvider = 'EASYPOST' | 'CLICKSHIP';

export interface IShippingQuote {
  source?: ShippingSource | null;
  carrier?: string | null;
  service?: string | null;
  cost?: number | null;
  fee?: number | null;
  overrideFee?: number | null;
  chargedFee?: number | null;
  currency?: string | null;
  transitDays?: number | null;
  packaging?: 'PARCEL' | 'PALLET' | null;
  weightKg?: number | null;
  quotedAt?: string | null;
  pending?: boolean | null;
  error?: string | null;
}

export interface IRateRow {
  country: string;
  region?: string | null;
  baseFee?: number | null;
  perKg?: number | null;
}

/** As returned by the server: API keys are never sent back, only whether they are set. */
export interface IShippingSettings {
  easyPostEnabled?: boolean;
  easyPostApiKeyConfigured?: boolean;
  clickShipEnabled?: boolean;
  clickShipApiKeyConfigured?: boolean;
  clickShipPaymentMethodId?: string | null;
  clickShipSandbox?: boolean;
  currency?: string | null;
  markupPercent?: number | null;
  weightPerUnitKg?: number | null;
  parcelLengthCm?: number | null;
  parcelWidthCm?: number | null;
  parcelHeightCm?: number | null;
  maxParcelWeightKg?: number | null;
  palletLengthCm?: number | null;
  palletWidthCm?: number | null;
  palletHeightCm?: number | null;
  rateTable?: IRateRow[];
  autoBuyLabel?: boolean;
}

export interface IPaymentMethod {
  id: string;
  type?: string | null;
  label?: string | null;
}

export interface ITestResult {
  ok: boolean;
  message: string;
}

export const NUMBER_FIELDS = [
  'markupPercent',
  'weightPerUnitKg',
  'parcelLengthCm',
  'parcelWidthCm',
  'parcelHeightCm',
  'maxParcelWeightKg',
  'palletLengthCm',
  'palletWidthCm',
  'palletHeightCm',
] as const;
export type NumberField = (typeof NUMBER_FIELDS)[number];

export interface IRateDraft {
  key: string;
  country: string;
  region: string;
  baseFee: string;
  perKg: string;
}

/** The page's editable copy: numbers as typed, and API keys typed but not saved yet. */
export interface IShippingDraft {
  easyPostEnabled: boolean;
  easyPostApiKey: string;
  clearEasyPostApiKey: boolean;
  clickShipEnabled: boolean;
  clickShipApiKey: string;
  clearClickShipApiKey: boolean;
  clickShipPaymentMethodId: string;
  clickShipSandbox: boolean;
  currency: string;
  numbers: Record<NumberField, string>;
  rateTable: IRateDraft[];
  autoBuyLabel: boolean;
}

export const SOURCE_LABEL: Record<ShippingSource, string> = {
  EASYPOST: 'EasyPost',
  CLICKSHIP: 'ClickShip',
  RATE_TABLE: 'Rate table',
};

export const COUNTRIES = [
  { value: 'CA', label: 'Canada' },
  { value: 'US', label: 'United States' },
];

export const CURRENCIES = ['CAD', 'USD'];

export const NUMBER_LIMITS: Record<NumberField, { label: string; max: number; allowZero?: boolean; placeholder: string }> = {
  markupPercent: { label: 'Markup (%)', max: 100, allowZero: true, placeholder: '0' },
  weightPerUnitKg: { label: 'Weight per unit (kg)', max: 100, placeholder: '0.5' },
  parcelLengthCm: { label: 'Parcel length (cm)', max: 300, placeholder: '40' },
  parcelWidthCm: { label: 'Parcel width (cm)', max: 300, placeholder: '30' },
  parcelHeightCm: { label: 'Parcel height (cm)', max: 300, placeholder: '30' },
  maxParcelWeightKg: { label: 'Largest parcel (kg)', max: 70, placeholder: '30' },
  palletLengthCm: { label: 'Pallet length (cm)', max: 400, placeholder: '120' },
  palletWidthCm: { label: 'Pallet width (cm)', max: 400, placeholder: '100' },
  palletHeightCm: { label: 'Pallet height (cm)', max: 400, placeholder: '120' },
};

export const isLiveSource = (source?: ShippingSource | null): source is ShippingProvider => source === 'EASYPOST' || source === 'CLICKSHIP';

let rateKey = 0;
export const newRateRow = (country = 'CA'): IRateDraft => ({ key: `rate-${++rateKey}`, country, region: '', baseFee: '', perKg: '' });

const text = (value?: number | null) => (value == null ? '' : String(value));

export const toDraft = (settings: IShippingSettings): IShippingDraft => ({
  easyPostEnabled: settings.easyPostEnabled === true,
  easyPostApiKey: '',
  clearEasyPostApiKey: false,
  clickShipEnabled: settings.clickShipEnabled === true,
  clickShipApiKey: '',
  clearClickShipApiKey: false,
  clickShipPaymentMethodId: settings.clickShipPaymentMethodId ?? '',
  clickShipSandbox: settings.clickShipSandbox === true,
  currency: settings.currency || 'CAD',
  numbers: NUMBER_FIELDS.reduce((all, field) => ({ ...all, [field]: text(settings[field]) }), {} as Record<NumberField, string>),
  rateTable: (settings.rateTable ?? []).map(row => ({
    ...newRateRow(row.country),
    region: row.region ?? '',
    baseFee: text(row.baseFee),
    perKg: text(row.perKg),
  })),
  autoBuyLabel: settings.autoBuyLabel !== false,
});

const parse = (value: string) => (value.trim() === '' ? null : Number(value));

export type ShippingErrors = Partial<Record<string, string>>;

export const validateShipping = (draft: IShippingDraft, saved: IShippingSettings): ShippingErrors => {
  const errors: ShippingErrors = {};
  NUMBER_FIELDS.forEach(field => {
    const value = parse(draft.numbers[field]);
    const limit = NUMBER_LIMITS[field];
    if (value == null) return;
    if (Number.isNaN(value) || value > limit.max || value < 0 || (!limit.allowZero && value === 0)) {
      errors[field] = `Enter ${limit.allowZero ? '0' : 'more than 0'} to ${limit.max}`;
    }
  });
  const easyPostKey = draft.easyPostApiKey.trim() !== '' || (saved.easyPostApiKeyConfigured && !draft.clearEasyPostApiKey);
  if (draft.easyPostEnabled && !easyPostKey) errors.easyPostApiKey = 'Enter the EasyPost API key';
  const clickShipKey = draft.clickShipApiKey.trim() !== '' || (saved.clickShipApiKeyConfigured && !draft.clearClickShipApiKey);
  if (draft.clickShipEnabled && !clickShipKey) errors.clickShipApiKey = 'Enter the ClickShip API key';
  if (draft.clickShipEnabled && !draft.clickShipPaymentMethodId) errors.clickShipPaymentMethodId = 'Choose the payment method';
  const seen = new Set<string>();
  draft.rateTable.forEach(row => {
    const region = row.region.trim().toUpperCase();
    const id = `${row.country}|${region}`;
    if (seen.has(id)) errors[`rate-${row.key}`] = 'This country and province are already in the table';
    seen.add(id);
    [row.baseFee, row.perKg].forEach(value => {
      const number = parse(value);
      if (number != null && (Number.isNaN(number) || number < 0)) errors[`rate-${row.key}`] = 'Fees cannot be negative';
    });
  });
  return errors;
};

export const toShippingPayload = (draft: IShippingDraft) => ({
  easyPostEnabled: draft.easyPostEnabled,
  easyPostApiKey: draft.easyPostApiKey.trim() || null,
  clearEasyPostApiKey: draft.clearEasyPostApiKey && !draft.easyPostApiKey.trim(),
  clickShipEnabled: draft.clickShipEnabled,
  clickShipApiKey: draft.clickShipApiKey.trim() || null,
  clearClickShipApiKey: draft.clearClickShipApiKey && !draft.clickShipApiKey.trim(),
  clickShipPaymentMethodId: draft.clickShipPaymentMethodId || null,
  clickShipSandbox: draft.clickShipSandbox,
  currency: draft.currency,
  ...NUMBER_FIELDS.reduce((all, field) => ({ ...all, [field]: parse(draft.numbers[field]) }), {} as Record<NumberField, number | null>),
  rateTable: draft.rateTable.map(row => ({
    country: row.country,
    region: row.region.trim().toUpperCase() || null,
    baseFee: parse(row.baseFee) ?? 0,
    perKg: parse(row.perKg) ?? 0,
  })),
  autoBuyLabel: draft.autoBuyLabel,
});

/** "ClickShip / Purolator Ground" */
export const quoteSource = (quote?: IShippingQuote | null) => {
  if (!quote?.source) return null;
  const service = [quote.carrier, quote.service].filter(Boolean).join(' ');
  return service ? `${SOURCE_LABEL[quote.source]} / ${service}` : SOURCE_LABEL[quote.source];
};
