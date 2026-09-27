export type StaleCreditPriceSource = 'SOURCE_ORDER_PRICE' | 'CURRENT_PRICE';
export type InvoiceTiming = 'ON_FACTORY_APPROVAL' | 'ON_DELIVERY' | 'MANUAL';
export type ShortageAllocation = 'PROPORTIONAL' | 'PRIORITY' | 'MANUAL';

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
}

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

export type SettingsErrors = Partial<Record<'staleReturnRateAlertPercent' | 'staleCreditPercent' | 'deliveryNoteFooter', string>>;

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
  return errors;
};

/** Sends every field; an empty footer is sent as '' and an empty alert percentage with the clear flag, so the server clears them. */
export const toSettingsPayload = (settings: IWholesaleSettings): IWholesaleSettings => ({
  ...settings,
  approvalEmailRecipients: [...(settings.approvalEmailRecipients ?? [])],
  reminderTimes: [...(settings.reminderTimes ?? [])].sort(),
  deliveryNoteFooter: settings.deliveryNoteFooter ?? '',
  clearStaleReturnRateAlertPercent: settings.staleReturnRateAlertPercent == null,
});

export const sameSettings = (a: IWholesaleSettings | null, b: IWholesaleSettings | null) =>
  JSON.stringify(a && toSettingsPayload(a)) === JSON.stringify(b && toSettingsPayload(b));
