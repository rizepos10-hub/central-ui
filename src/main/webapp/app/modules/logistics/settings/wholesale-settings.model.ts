export type StaleCreditPriceSource = 'SOURCE_ORDER_PRICE' | 'CURRENT_PRICE';
export type InvoiceTiming = 'ON_FACTORY_APPROVAL' | 'ON_DELIVERY' | 'MANUAL';
export type ShortageAllocation = 'PROPORTIONAL' | 'PRIORITY' | 'MANUAL';
export type ProofOfDelivery = 'NONE' | 'SIGNATURE' | 'SIGNATURE_AND_PHOTO';
export type CarrierDispatch = 'ON_ORDER' | 'AT_CUTOFF_TIMES';

export interface IWholesaleCarrier {
  /** Set by the server for new carriers. */
  id?: string | null;
  name: string;
  /** Link with {tracking} where the tracking number goes. */
  trackingUrl?: string | null;
  active?: boolean | null;
}

export interface IWholesaleSettings {
  salesmanCanViewOldOrders?: boolean | null;
  approvalEmailRecipients?: string[];
  allowOverDelivery?: boolean | null;
  requireReasonOnQuantityChange?: boolean | null;
  /** HH:mm, sorted by the server. */
  reminderTimes?: string[];
  escalateToManagerAtCutoff?: boolean | null;
  autoDraftFromFrequencyAtCutoff?: boolean | null;
  staleReturnRateAlertPercent?: number | null;
  /** Request only: switches the alert off, since an empty percentage means "keep" on the server. */
  clearStaleReturnRateAlertPercent?: boolean;
  staleCreditPercent?: number | null;
  staleCreditPriceSource?: StaleCreditPriceSource | null;
  deliveryNoteFooter?: string | null;
  invoiceTiming?: InvoiceTiming | null;
  defaultShortageAllocation?: ShortageAllocation | null;
  proofOfDelivery?: ProofOfDelivery | null;
  alertOnNotPaidCashOnly?: boolean | null;
  staleRateWindowDays?: number | null;
  liveTrackingIntervalSeconds?: number | null;
  /** Branch the customer portal records its orders under; the portal can't take orders without it. */
  portalBranchId?: string | null;
  /** Orders on carrier routes are shipped by a carrier instead of a driver. */
  carrierShippingEnabled?: boolean | null;
  carriers?: IWholesaleCarrier[];
  carrierDispatch?: CarrierDispatch | null;
  /** HH:mm, used when carrierDispatch is AT_CUTOFF_TIMES. */
  carrierCutoffTimes?: string[];
}

export const STALE_WINDOW_DAYS = { min: 1, max: 90, fallback: 7 };
export const TRACKING_SECONDS = { min: 15, max: 900, fallback: 60 };

export interface Option<T extends string> {
  value: T;
  label: string;
  description: string;
}

export const PRICE_SOURCES: Option<StaleCreditPriceSource>[] = [
  { value: 'SOURCE_ORDER_PRICE', label: 'Price it was sold at', description: 'Uses the current customer price when the original delivery is unknown.' },
  { value: 'CURRENT_PRICE', label: 'Current price', description: "The customer's price on the day of the return." },
];

export const INVOICE_TIMINGS: Option<InvoiceTiming>[] = [
  { value: 'ON_FACTORY_APPROVAL', label: 'When the factory approves', description: 'Issued as soon as the factory approves the order.' },
  { value: 'ON_DELIVERY', label: 'On delivery', description: 'Issued when the delivery is completed.' },
  { value: 'MANUAL', label: 'Manually', description: 'Someone issues each invoice.' },
];

export const SHORTAGE_ALLOCATIONS: Option<ShortageAllocation>[] = [
  { value: 'PROPORTIONAL', label: 'Proportionally', description: "Each customer's quantity is reduced by the same share." },
  { value: 'PRIORITY', label: 'By customer priority', description: 'Customers with a lower allocation priority number keep their quantities first.' },
  { value: 'MANUAL', label: 'Manually', description: 'The shortage is split by hand.' },
];

export const PROOFS_OF_DELIVERY: Option<ProofOfDelivery>[] = [
  { value: 'NONE', label: 'Nothing extra', description: 'Only the time and location of the delivery are recorded.' },
  { value: 'SIGNATURE', label: 'Signature', description: "The customer signs on the driver's phone." },
  { value: 'SIGNATURE_AND_PHOTO', label: 'Signature and photo', description: 'The customer signs and the driver photographs the delivery.' },
];

export const CARRIER_DISPATCHES: Option<CarrierDispatch>[] = [
  { value: 'ON_ORDER', label: 'Right away', description: 'Each order goes to the factory as its own factory order as soon as it is placed.' },
  { value: 'AT_CUTOFF_TIMES', label: 'At cut-off times', description: 'Orders are collected and sent to the factory together at each cut-off time.' },
];

export const MAX_FOOTER_LENGTH = 2000;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const normalizeEmail = (text: string) => text.trim().toLowerCase();

export const isEmail = (text: string) => EMAIL.test(normalizeEmail(text));

export const isTime = (text: string) => TIME.test(text.trim());

export const addUnique = (list: string[] | undefined, value: string, sort = false) => {
  const next = (list ?? []).includes(value) ? [...(list ?? [])] : [...(list ?? []), value];
  return sort ? next.sort() : next;
};

export type SettingsErrors = Partial<
  Record<
    'staleReturnRateAlertPercent' | 'staleCreditPercent' | 'deliveryNoteFooter' | 'staleRateWindowDays' | 'liveTrackingIntervalSeconds' | 'carriers' | 'carrierCutoffTimes',
    string
  >
>;

const TRACKING_LINK = /^https?:\/\//i;

export const carrierError = (carriers: IWholesaleCarrier[] | undefined): string | undefined => {
  const names = new Set<string>();
  for (const carrier of carriers ?? []) {
    const name = (carrier.name ?? '').trim().toLowerCase();
    if (!name) return 'Every carrier needs a name';
    if (names.has(name)) return `Carrier names must be unique: ${carrier.name.trim()}`;
    names.add(name);
    const link = (carrier.trackingUrl ?? '').trim();
    if (link && !TRACKING_LINK.test(link)) return 'Tracking links must start with http:// or https://';
  }
  return undefined;
};

const wholeNumberError = (value: number | null | undefined, range: { min: number; max: number }) => {
  if (value == null) return undefined;
  return Number.isInteger(value) && value >= range.min && value <= range.max ? undefined : `Use a whole number from ${range.min} to ${range.max}`;
};

const percentError = (value: number | null | undefined, required: boolean) => {
  if (value == null) return required ? 'Enter a percentage from 0 to 100' : undefined;
  return Number.isFinite(value) && value >= 0 && value <= 100 ? undefined : 'Use a percentage from 0 to 100';
};

export const validateSettings = (settings: IWholesaleSettings): SettingsErrors => {
  const errors: SettingsErrors = {};
  const alert = percentError(settings.staleReturnRateAlertPercent, false);
  if (alert) errors.staleReturnRateAlertPercent = alert;
  const credit = percentError(settings.staleCreditPercent, true);
  if (credit) errors.staleCreditPercent = credit;
  if ((settings.deliveryNoteFooter ?? '').length > MAX_FOOTER_LENGTH) errors.deliveryNoteFooter = `Use at most ${MAX_FOOTER_LENGTH} characters`;
  const window = wholeNumberError(settings.staleRateWindowDays, STALE_WINDOW_DAYS);
  if (window) errors.staleRateWindowDays = window;
  const tracking = wholeNumberError(settings.liveTrackingIntervalSeconds, TRACKING_SECONDS);
  if (tracking) errors.liveTrackingIntervalSeconds = tracking;
  const carriers = carrierError(settings.carriers);
  if (carriers) errors.carriers = carriers;
  if (settings.carrierShippingEnabled && settings.carrierDispatch === 'AT_CUTOFF_TIMES' && (settings.carrierCutoffTimes ?? []).length === 0) {
    errors.carrierCutoffTimes = 'Add at least one cut-off time';
  }
  return errors;
};

/** Sends every field; an empty footer or portal branch is sent as '' and an empty alert percentage with the clear flag, so the server clears them. */
export const toSettingsPayload = (settings: IWholesaleSettings): IWholesaleSettings => ({
  ...settings,
  approvalEmailRecipients: [...(settings.approvalEmailRecipients ?? [])],
  reminderTimes: [...(settings.reminderTimes ?? [])].sort(),
  carriers: (settings.carriers ?? []).map(c => ({ ...c, name: (c.name ?? '').trim(), trackingUrl: (c.trackingUrl ?? '').trim() || null })),
  carrierCutoffTimes: [...(settings.carrierCutoffTimes ?? [])].sort(),
  deliveryNoteFooter: settings.deliveryNoteFooter ?? '',
  portalBranchId: settings.portalBranchId ?? '',
  clearStaleReturnRateAlertPercent: settings.staleReturnRateAlertPercent == null,
});

export const sameSettings = (a: IWholesaleSettings | null, b: IWholesaleSettings | null) =>
  JSON.stringify(a && toSettingsPayload(a)) === JSON.stringify(b && toSettingsPayload(b));
