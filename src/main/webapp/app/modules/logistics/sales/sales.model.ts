import { DayOfWeek, ICustomerAddress, IWholesaleCustomer, OrderMethod, WholesalePaymentMethod } from '../customers/wholesale-customer.model';

export type FrequencyType = 'DAILY' | 'WEEKDAYS' | 'EVERY_N_DAYS';
export type OrderSource = 'SALESPERSON' | 'CALL_LIST' | 'AUTO_FREQUENCY' | 'CUSTOMER_PORTAL';
export type CallOutcome = 'CALLED' | 'NO_ANSWER' | 'CALL_BACK' | 'ORDERED' | 'NO_ORDER_NEEDED';
export type NoteSource = 'CALL_LIST' | 'ORDER_ENTRY' | 'DRIVER' | 'OTHER';
export type NoteStatus = 'OPEN' | 'RESOLVED';

export interface IOrderFrequency {
  id?: string;
  customerId?: string;
  itemId: string;
  variantId?: string | null;
  quantity: number | null;
  frequencyType: FrequencyType;
  weekdays?: DayOfWeek[];
  intervalDays?: number | null;
  anchorDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  active?: boolean;
  notes?: string | null;
}

export interface ICatalogVariant {
  id: string;
  name?: string | null;
  price?: number | null;
}

export interface ICatalogItem {
  itemId: string;
  name?: string | null;
  categories: { id: string; name?: string | null }[];
  /** False when the item is outside the salesperson's categories. */
  orderable: boolean;
  sourcing?: string | null;
  variants: ICatalogVariant[];
}

export interface ISuggestedLine {
  frequencyId?: string;
  itemId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
}

export interface ISuggestedOrder {
  customerId: string;
  date: string;
  deliveryDay: boolean;
  scheduledDates: string[];
  lines: ISuggestedLine[];
}

export interface IOrderEntryCustomer {
  customerId: string;
  name: string;
  accountNumber?: string | null;
  phone?: string | null;
  defaultRouteId?: string | null;
  routeId?: string | null;
  overrideId?: string | null;
  stopSequence?: number | null;
  factoryId?: string | null;
  deliveryDay: boolean;
  orderIds: string[];
  blocked: boolean;
  cashOnly?: boolean | null;
  defaultPaymentMethod?: WholesalePaymentMethod | null;
  defaultOrderMethod?: OrderMethod | null;
  defaultDeliveryAddressId?: string | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
}

export interface IItemHistory {
  itemId: string;
  variantId?: string | null;
  lastQuantity?: number | null;
  lastDeliveryDate?: string | null;
  lastOrderedAt?: string | null;
  timesOrdered: number;
}

export interface ICreditStatus {
  customerId: string;
  onAccountEnabled: boolean;
  unlimited: boolean;
  debitLimit?: number | null;
  debitUsed?: number | null;
  available?: number | null;
  overLimit: boolean;
  unpaidOrders: number;
  unpaidTotal?: number | null;
  oldestUnpaidDate?: string | null;
}

export interface IRouteOverride {
  id?: string;
  customerId: string;
  deliveryDate: string;
  fromRouteId?: string | null;
  toRouteId: string;
  stopSequence?: number | null;
  reason?: string | null;
}

export interface ICallListEntry {
  customerId: string;
  name: string;
  accountNumber?: string | null;
  phone?: string | null;
  routeId?: string | null;
  stopSequence?: number | null;
  factoryId?: string | null;
  orderIds: string[];
  pending: boolean;
  lastOutcome?: CallOutcome | null;
  lastCallAt?: string | null;
  lastCalledBy?: string | null;
  followUpAt?: string | null;
  callCount: number;
}

export interface ICallLog {
  id?: string;
  salesmanId?: string | null;
  customerId: string;
  deliveryDate: string;
  outcome: CallOutcome;
  followUpAt?: string | null;
  orderId?: string | null;
  notes?: string | null;
  createdDate?: string | null;
}

export interface ICustomerNote {
  id?: string;
  customerId: string;
  customerName?: string | null;
  text: string;
  sendToRoles?: string[];
  sendToUserIds?: string[];
  urgent?: boolean;
  source?: NoteSource | null;
  orderId?: string | null;
  status?: NoteStatus;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  emailSentAt?: string | null;
  createdBy?: string | null;
  createdDate?: string | null;
}

export const FREQUENCY_TYPES: { value: FrequencyType; label: string }[] = [
  { value: 'DAILY', label: 'Every delivery' },
  { value: 'WEEKDAYS', label: 'On weekdays' },
  { value: 'EVERY_N_DAYS', label: 'Every N days' },
];

export const CALL_OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'NO_ORDER_NEEDED', label: 'No order needed' },
  { value: 'CALL_BACK', label: 'Call back' },
  { value: 'NO_ANSWER', label: 'No answer' },
  { value: 'CALLED', label: 'Called' },
];

export const NOTE_ROLES: { value: string; label: string }[] = [
  { value: 'ROLE_WHOLESALE_SALES_MANAGER', label: 'Sales managers' },
  { value: 'ROLE_WHOLESALE_SALESMAN', label: 'Salespeople' },
  { value: 'ROLE_WHOLESALE_FACTORY', label: 'Factory' },
  { value: 'ROLE_WHOLESALE_BOOKKEEPER', label: 'Bookkeepers' },
  { value: 'ROLE_WHOLESALE_ADMIN', label: 'Wholesale admins' },
];

export const outcomeLabel = (outcome?: CallOutcome | null) => CALL_OUTCOMES.find(o => o.value === outcome)?.label ?? '-';

// Dates are plain yyyy-MM-dd strings; UTC keeps day arithmetic free of the browser's time zone.
const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const format = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (iso: string, days: number) => {
  const date = parse(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return format(date);
};

export const daysBetween = (from: string, to: string) => Math.round((parse(to).getTime() - parse(from).getTime()) / 86400000);

export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

const WEEKDAYS: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const dayOfWeek = (iso: string): DayOfWeek => WEEKDAYS[parse(iso).getUTCDay()];

export const formatDay = (iso: string) =>
  parse(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

const inWindow = (line: IOrderFrequency, iso: string) => (!line.startDate || iso >= line.startDate) && (!line.endDate || iso <= line.endDate);

/** Same rule as the server resolver. */
export const isDueOn = (line: IOrderFrequency, iso: string) => {
  if (line.active === false || !inWindow(line, iso)) return false;
  switch (line.frequencyType) {
    case 'DAILY':
      return true;
    case 'WEEKDAYS':
      return !!line.weekdays?.includes(dayOfWeek(iso));
    case 'EVERY_N_DAYS': {
      if (!line.anchorDate || !line.intervalDays || line.intervalDays < 1) return false;
      const days = daysBetween(line.anchorDate, iso);
      return days >= 0 && days % line.intervalDays === 0;
    }
    default:
      return false;
  }
};

export const nextDueDates = (line: IOrderFrequency, from: string, count = 3, horizonDays = 120) => {
  const dates: string[] = [];
  for (let i = 0; i <= horizonDays && dates.length < count; i++) {
    const day = addDays(from, i);
    if (isDueOn(line, day)) dates.push(day);
  }
  return dates;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** First problem with a line, in the server's words, or undefined. */
export const validateFrequency = (line: IOrderFrequency): string | undefined => {
  if (!line.itemId) return 'Choose an item';
  if (line.quantity == null || !(line.quantity > 0)) return 'The quantity must be more than zero';
  if (line.frequencyType === 'WEEKDAYS' && !line.weekdays?.length) return 'Choose at least one weekday';
  if (line.frequencyType === 'EVERY_N_DAYS') {
    if (!line.intervalDays || !Number.isInteger(line.intervalDays) || line.intervalDays < 1 || line.intervalDays > 365) {
      return 'Every how many days must be between 1 and 365';
    }
    if (!line.anchorDate || !DATE.test(line.anchorDate)) return 'Choose the first date';
  }
  if (line.startDate && line.endDate && line.endDate < line.startDate) return 'The end date is before the start date';
  return undefined;
};

const blankToNull = (value?: string | null) => (value == null || value.trim() === '' ? null : value.trim());

export const toFrequencyPayload = (lines: IOrderFrequency[]): IOrderFrequency[] =>
  lines.map(line => ({
    ...(line.id ? { id: line.id } : {}),
    itemId: line.itemId,
    variantId: blankToNull(line.variantId),
    quantity: line.quantity,
    frequencyType: line.frequencyType,
    weekdays: line.frequencyType === 'WEEKDAYS' ? line.weekdays ?? [] : [],
    intervalDays: line.frequencyType === 'EVERY_N_DAYS' ? line.intervalDays : null,
    anchorDate: line.frequencyType === 'EVERY_N_DAYS' ? blankToNull(line.anchorDate) : null,
    startDate: blankToNull(line.startDate),
    endDate: blankToNull(line.endDate),
    active: line.active !== false,
    notes: blankToNull(line.notes),
  }));

export const lineKey = (itemId: string, variantId?: string | null) => `${itemId}:${variantId ?? ''}`;

export interface IEntryRow {
  key: string;
  itemId: string;
  variantId: string | null;
  name: string;
  variantName?: string | null;
  price?: number | null;
  orderable: boolean;
  history?: IItemHistory;
  suggested?: ISuggestedLine;
  group: 'usual' | 'previous' | 'other';
}

/**
 * One row per catalog item and variant, grouped: the customer's usual order (frequency lines due that day), items
 * ordered before, and everything else. A usual line whose variant is not set matches the item's first variant.
 */
export const buildEntryRows = (catalog: ICatalogItem[], suggested: ISuggestedLine[], history: IItemHistory[]): IEntryRow[] => {
  const historyByKey = new Map(history.map(h => [lineKey(h.itemId, h.variantId), h]));
  const rows: IEntryRow[] = [];
  catalog.forEach(item => {
    const variants = item.variants.length ? item.variants : [{ id: null as string | null, name: null, price: null }];
    variants.forEach((variant, index) => {
      const key = lineKey(item.itemId, variant.id);
      const usual = suggested.find(s => s.itemId === item.itemId && (s.variantId ? s.variantId === variant.id : index === 0));
      const past = historyByKey.get(key) ?? (index === 0 ? historyByKey.get(lineKey(item.itemId, null)) : undefined);
      rows.push({
        key,
        itemId: item.itemId,
        variantId: variant.id,
        name: item.name ?? item.itemId,
        variantName: variants.length > 1 ? variant.name : null,
        price: variant.price,
        orderable: item.orderable,
        history: past,
        suggested: usual,
        group: usual ? 'usual' : past ? 'previous' : 'other',
      });
    });
  });
  const order = { usual: 0, previous: 1, other: 2 };
  return rows.sort((a, b) => order[a.group] - order[b.group] || a.name.localeCompare(b.name));
};

export const initialQuantities = (rows: IEntryRow[]) => {
  const quantities: Record<string, number> = {};
  rows.forEach(row => {
    if (row.suggested && row.orderable) quantities[row.key] = row.suggested.quantity;
  });
  return quantities;
};

export const creditWarning = (status?: ICreditStatus | null): string | undefined => {
  if (!status) return undefined;
  if (status.overLimit) return `Over the credit limit: ${money(status.debitUsed)} used of ${money(status.debitLimit)}.`;
  if (status.unpaidOrders > 0 && status.oldestUnpaidDate) {
    return `${status.unpaidOrders} unpaid order${status.unpaidOrders === 1 ? '' : 's'} (${money(status.unpaidTotal)}), oldest ${status.oldestUnpaidDate}.`;
  }
  return undefined;
};

export const money = (value?: number | null) => (value == null ? '-' : `$${Number(value).toFixed(2)}`);

export interface PlacementInput {
  customer: IWholesaleCustomer;
  entryCustomer: IOrderEntryCustomer;
  branchId: string;
  tillId?: string | null;
  deliveryDate: string;
  orderMethod: OrderMethod;
  rows: IEntryRow[];
  quantities: Record<string, number>;
  itemNotes: Record<string, string>;
  notes: string;
  source: OrderSource;
}

const deliveryAddress = (customer: IWholesaleCustomer, addressId?: string | null): ICustomerAddress | null => {
  const addresses = customer.deliveryAddresses ?? [];
  return (addressId && addresses.find(a => a.id === addressId)) || addresses.find(a => a.isDefaultAddress) || addresses[0] || null;
};

/** The request for `POST api/orders/place-order`; lines with no quantity are left out. */
export const toPlacementRequest = (input: PlacementInput) => {
  const items = input.rows
    .filter(row => row.orderable && (input.quantities[row.key] ?? 0) > 0)
    .map(row => ({
      itemId: row.itemId,
      variantId: row.variantId,
      amount: input.quantities[row.key],
      price: row.price ?? 0,
      ...(input.itemNotes[row.key]?.trim() ? { notes: input.itemNotes[row.key].trim() } : {}),
    }));
  const autoFilled = input.rows.some(row => row.suggested && input.quantities[row.key] === row.suggested.quantity);
  return {
    branchId: input.branchId,
    ...(input.tillId ? { tillId: input.tillId } : {}),
    wholesale: true,
    orderMethod: input.orderMethod,
    processingStatus: 'PROCESSING',
    customer: {
      id: input.customer.id,
      firstName: input.customer.firstName ?? null,
      lastName: input.customer.lastName ?? null,
      phone: input.customer.mobileNumber || input.customer.phone || null,
      email: input.customer.email ?? null,
      ...(input.customer.businessName ? { businessDetails: { businessName: input.customer.businessName } } : {}),
    },
    deliverTo: input.orderMethod === 'Delivery' ? deliveryAddress(input.customer, input.entryCustomer.defaultDeliveryAddressId) : null,
    scheduledAt: `${input.deliveryDate}T12:00:00.000Z`,
    items,
    wholesaleDetails: {
      deliveryDate: input.deliveryDate,
      source: input.source,
      autoFilled,
      notes: input.notes.trim() || null,
    },
  };
};
