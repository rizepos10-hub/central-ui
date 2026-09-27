export type ClosureScope = 'BUSINESS' | 'FACTORY' | 'ROUTE' | 'CUSTOMER';
export type ClosureAction = 'SKIP' | 'MOVE';
export type DeliveryDayStatus = 'DELIVER' | 'NOT_DELIVERY_DAY' | 'SKIPPED' | 'MOVED';

export interface IWholesaleClosure {
  id?: string;
  scope?: ClosureScope | null;
  /** Null for BUSINESS. */
  scopeId?: string | null;
  /** yyyy-MM-dd, inclusive. */
  fromDate?: string | null;
  toDate?: string | null;
  action?: ClosureAction | null;
  /** yyyy-MM-dd; only for MOVE, and outside the closure. */
  moveToDate?: string | null;
  reason?: string | null;
}

export interface IDeliveryDay {
  date: string;
  status: DeliveryDayStatus;
  /** Null when skipped. */
  deliveryDate?: string | null;
  closureIds?: string[];
}

export const SCOPES: { value: ClosureScope; label: string }[] = [
  { value: 'BUSINESS', label: 'Whole business' },
  { value: 'FACTORY', label: 'Factory' },
  { value: 'ROUTE', label: 'Route' },
  { value: 'CUSTOMER', label: 'Customer' },
];

export const ACTIONS: { value: ClosureAction; label: string }[] = [
  { value: 'SKIP', label: 'Skip deliveries' },
  { value: 'MOVE', label: 'Move deliveries' },
];

export const scopeLabel = (scope?: ClosureScope | null) => SCOPES.find(s => s.value === scope)?.label ?? '-';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as yyyy-MM-dd; closures are whole days with no time zone. */
export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseIsoDate = (text: string) => {
  const [y, m, d] = text.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (text: string, days: number) => {
  const date = parseIsoDate(text);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

export const monthStart = (year: number, month: number) => toIsoDate(new Date(year, month, 1));

/** Six Monday-first weeks covering the month. */
export const monthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = toIsoDate(new Date(year, month, 1 - offset));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
};

export const formatDay = (text?: string | null, withWeekday = true) => {
  if (!text) return '';
  return parseIsoDate(text).toLocaleDateString(undefined, {
    ...(withWeekday ? { weekday: 'short' } : {}),
    month: 'short',
    day: 'numeric',
  });
};

export const formatRange = (from?: string | null, to?: string | null) =>
  !from ? '' : !to || to === from ? formatDay(from) : `${formatDay(from)} to ${formatDay(to)}`;

export const overlaps = (closure: IWholesaleClosure, day: string) => !!closure.fromDate && closure.fromDate <= day && day <= (closure.toDate || closure.fromDate);

export interface RouteDayMark {
  routeId: string;
  name: string;
  color?: string | null;
  /** MOVED_IN marks the day a moved delivery lands on. */
  status: 'DELIVER' | 'SKIPPED' | 'MOVED' | 'MOVED_IN';
  /** For MOVED the new date, for MOVED_IN the original date. */
  otherDate?: string | null;
}

export const buildRouteMarks = (entries: { route: { id: string; name?: string | null; color?: string | null }; days: IDeliveryDay[] }[]) => {
  const marks: Record<string, RouteDayMark[]> = {};
  const add = (date: string, mark: RouteDayMark) => {
    (marks[date] = marks[date] ?? []).push(mark);
  };
  entries.forEach(({ route, days }) => {
    const base = { routeId: route.id, name: route.name ?? route.id, color: route.color };
    days.forEach(day => {
      if (day.status === 'DELIVER') add(day.date, { ...base, status: 'DELIVER' });
      else if (day.status === 'SKIPPED') add(day.date, { ...base, status: 'SKIPPED' });
      else if (day.status === 'MOVED') {
        add(day.date, { ...base, status: 'MOVED', otherDate: day.deliveryDate });
        if (day.deliveryDate) add(day.deliveryDate, { ...base, status: 'MOVED_IN', otherDate: day.date });
      }
    });
  });
  return marks;
};

export const newClosure = (fromDate: string): IWholesaleClosure => ({
  scope: 'BUSINESS',
  scopeId: null,
  fromDate,
  toDate: fromDate,
  action: 'SKIP',
  moveToDate: null,
  reason: '',
});

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export type ClosureErrors = Partial<Record<'scopeId' | 'dates' | 'moveToDate', string>>;

export const validateClosure = (closure: IWholesaleClosure): ClosureErrors => {
  const errors: ClosureErrors = {};
  if (closure.scope !== 'BUSINESS' && !closure.scopeId) {
    errors.scopeId = `Choose the ${scopeLabel(closure.scope).toLowerCase()} the closure applies to`;
  }
  const from = closure.fromDate;
  const to = closure.toDate || closure.fromDate;
  if (!from || !ISO.test(from) || !ISO.test(to)) {
    errors.dates = 'Choose the closed dates';
  } else if (to < from) {
    errors.dates = 'The end date is before the start date';
  }
  if (closure.action === 'MOVE') {
    const moveTo = closure.moveToDate;
    if (!moveTo || !ISO.test(moveTo)) {
      errors.moveToDate = 'Choose the day deliveries move to';
    } else if (!errors.dates && moveTo >= from && moveTo <= to) {
      errors.moveToDate = 'Deliveries cannot be moved to a day inside the same closure';
    }
  }
  return errors;
};

export const toClosurePayload = (closure: IWholesaleClosure): IWholesaleClosure => ({
  id: closure.id,
  scope: closure.scope,
  scopeId: closure.scope === 'BUSINESS' ? null : closure.scopeId,
  fromDate: closure.fromDate,
  toDate: closure.toDate || closure.fromDate,
  action: closure.action ?? 'SKIP',
  moveToDate: closure.action === 'MOVE' ? closure.moveToDate : null,
  reason: closure.reason?.trim() || null,
});
