import { DAYS, DayOfWeek, IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';

export interface IRouteDefinition extends Omit<IWholesaleRouteDefinition, 'id'> {
  id?: string;
  defaultDriverUsername?: string | null;
  salesmanIds?: string[];
  notes?: string | null;
}

export interface IRouteMember {
  customerId: string;
  name?: string | null;
  businessName?: string | null;
  stopSequence?: number | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  active?: boolean | null;
  deliveryDays?: DayOfWeek[];
}

export interface IRouteOptimization {
  routeDefinitionId: string;
  /** Null when the route's factory has no pin; the proposal then starts at the current first stop. */
  originFactoryId?: string | null;
  customerIds: string[];
  unlocatedCustomerIds: string[];
  currentKm?: number | null;
  proposedKm?: number | null;
}

export interface IWholesaleDriver {
  id?: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
}

export const DEFAULT_ROUTE_COLOR = '#0f766e';

export const newRoute = (): IRouteDefinition => ({
  name: '',
  code: '',
  factoryId: null,
  defaultDriverUsername: null,
  salesmanIds: [],
  deliveryDays: [],
  active: true,
  color: DEFAULT_ROUTE_COLOR,
  notes: '',
});

export type RouteErrors = Partial<Record<'name', string>>;

export const validateRoute = (route: IRouteDefinition): RouteErrors => (route.name?.trim() ? {} : { name: 'Enter the route name' });

const blankToNull = (value?: string | null) => (value == null || value.trim() === '' ? null : value.trim());

export const toRoutePayload = (route: IRouteDefinition): IRouteDefinition => ({
  ...route,
  name: route.name?.trim(),
  code: blankToNull(route.code),
  factoryId: blankToNull(route.factoryId),
  defaultDriverUsername: blankToNull(route.defaultDriverUsername),
  deliveryDays: DAYS.map(d => d.value).filter(day => route.deliveryDays?.includes(day)),
  active: route.active !== false,
  color: blankToNull(route.color),
  notes: blankToNull(route.notes),
});

export const memberName = (member: IRouteMember) => member.businessName || member.name || member.customerId;

export const hasLocation = (member: IRouteMember) => member.latitude != null && member.longitude != null;

export const driverName = (driver?: IWholesaleDriver | null) => {
  if (!driver) return '';
  const name = [driver.firstName, driver.lastName].filter(Boolean).join(' ').trim();
  return name ? `${name} (${driver.username})` : driver.username;
};

export const moveItem = <T>(items: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** Orders the members by a list of customer ids; members missing from the list keep their order at the end. */
export const orderByIds = (members: IRouteMember[], customerIds: string[]) => {
  const rank = new Map(customerIds.map((id, index) => [id, index]));
  return members
    .map((member, index) => ({ member, index }))
    .sort((a, b) => (rank.get(a.member.customerId) ?? customerIds.length + a.index) - (rank.get(b.member.customerId) ?? customerIds.length + b.index))
    .map(entry => entry.member);
};

export const sameOrder = (a: IRouteMember[], b: IRouteMember[]) => a.length === b.length && a.every((m, i) => m.customerId === b[i].customerId);
