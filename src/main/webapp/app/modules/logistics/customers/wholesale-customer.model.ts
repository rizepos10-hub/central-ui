import { IWholesaleFactory } from '../factories/wholesale-factory.model';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type WholesalePaymentMethod = 'CASH' | 'CREDIT' | 'CHECK';
export type OrderMethod = 'WalkIn' | 'DineIn' | 'PickUp' | 'Delivery';

export interface ICustomerAddress {
  id?: string;
  latitude?: string | null;
  longitude?: string | null;
  address?: string | null;
  addressType?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isDefaultAddress?: boolean | null;
}

export interface ICustomerWholesaleProfile {
  defaultRouteId?: string | null;
  /** Set by the server; stop order is edited on Route Setup. */
  routeStopSequence?: number | null;
  deliveryDays?: DayOfWeek[];
  defaultPaymentMethod?: WholesalePaymentMethod | null;
  cashOnly?: boolean | null;
  factoryId?: string | null;
  /** Set by the server from the routing address. */
  suggestedFactoryId?: string | null;
  factoryOverridden?: boolean | null;
  defaultDeliveryAddressId?: string | null;
  defaultOrderMethod?: OrderMethod | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  active?: boolean | null;
  allocationPriority?: number | null;
  /** Default carrier for a customer on a carrier route. */
  carrierId?: string | null;
}

export interface IWholesaleCustomer {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  accountNumber?: string | null;
  phone?: string | null;
  mobileNumber?: string | null;
  email?: string | null;
  blocked?: boolean;
  onAccountEnabled?: boolean;
  deliveryAddresses?: ICustomerAddress[];
  /** Null when the customer is not a wholesale customer. */
  wholesaleProfile?: ICustomerWholesaleProfile | null;
}

export interface IWholesaleRouteDefinition {
  id: string;
  name?: string | null;
  code?: string | null;
  factoryId?: string | null;
  deliveryDays?: DayOfWeek[];
  active?: boolean | null;
  color?: string | null;
  /** Shipped by a carrier: open every day, no driver and no order sheet. */
  carrierShipping?: boolean | null;
}

export const DAYS: { value: DayOfWeek; short: string }[] = [
  { value: 'MONDAY', short: 'Mon' },
  { value: 'TUESDAY', short: 'Tue' },
  { value: 'WEDNESDAY', short: 'Wed' },
  { value: 'THURSDAY', short: 'Thu' },
  { value: 'FRIDAY', short: 'Fri' },
  { value: 'SATURDAY', short: 'Sat' },
  { value: 'SUNDAY', short: 'Sun' },
];

export const PAYMENT_METHODS: { value: WholesalePaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT', label: 'On account' },
  { value: 'CHECK', label: 'Check' },
];

export const ORDER_METHODS: { value: OrderMethod; label: string }[] = [
  { value: 'Delivery', label: 'Delivery' },
  { value: 'PickUp', label: 'Pick up' },
];

export const paymentMethodLabel = (method?: WholesalePaymentMethod | null) => PAYMENT_METHODS.find(m => m.value === method)?.label ?? '-';

export const daysLabel = (days?: DayOfWeek[] | null) => {
  if (!days?.length) return '-';
  if (days.length === 7) return 'Every day';
  return DAYS.filter(d => days.includes(d.value))
    .map(d => d.short)
    .join(' ');
};

export const customerName = (customer?: Pick<IWholesaleCustomer, 'firstName' | 'lastName' | 'businessName' | 'id'> | null) => {
  if (!customer) return '';
  const person = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim();
  return customer.businessName || person || customer.id;
};

export const formatAddress = (address?: ICustomerAddress | null) => {
  if (!address) return '';
  return address.address || [address.street, address.city, address.state, address.postalCode].filter(Boolean).join(', ');
};

export const newProfile = (): ICustomerWholesaleProfile => ({
  active: true,
  deliveryDays: [],
  cashOnly: false,
  defaultOrderMethod: 'Delivery',
  factoryOverridden: false,
});

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ProfileErrors = Partial<Record<'deliveryWindow' | 'allocationPriority', string>>;

export const validateProfile = (profile: ICustomerWholesaleProfile): ProfileErrors => {
  const errors: ProfileErrors = {};
  const start = profile.deliveryWindowStart?.trim();
  const end = profile.deliveryWindowEnd?.trim();
  if ((start && !TIME.test(start)) || (end && !TIME.test(end))) {
    errors.deliveryWindow = 'Use HH:mm, for example 06:30';
  } else if (start && end && end < start) {
    errors.deliveryWindow = 'The window ends before it starts';
  }
  if (profile.allocationPriority != null && (!Number.isInteger(profile.allocationPriority) || profile.allocationPriority < 0)) {
    errors.allocationPriority = 'Use a whole number, 0 or more';
  }
  return errors;
};

const blankToNull = (value?: string | null) => (value == null || value.trim() === '' ? null : value.trim());

/**
 * The editable fields the profile endpoint accepts. A null factory follows the server's suggestion; any other
 * factory is kept as an override.
 */
export const toProfilePayload = (profile: ICustomerWholesaleProfile, followSuggestion: boolean): ICustomerWholesaleProfile => ({
  defaultRouteId: blankToNull(profile.defaultRouteId),
  deliveryDays: DAYS.map(d => d.value).filter(day => profile.deliveryDays?.includes(day)),
  defaultPaymentMethod: profile.defaultPaymentMethod ?? null,
  cashOnly: profile.cashOnly === true,
  factoryId: followSuggestion ? null : blankToNull(profile.factoryId),
  defaultDeliveryAddressId: blankToNull(profile.defaultDeliveryAddressId),
  defaultOrderMethod: profile.defaultOrderMethod ?? null,
  deliveryWindowStart: blankToNull(profile.deliveryWindowStart),
  deliveryWindowEnd: blankToNull(profile.deliveryWindowEnd),
  active: profile.active !== false,
  allocationPriority: profile.allocationPriority ?? null,
  carrierId: blankToNull(profile.carrierId),
});

/** Same choice as the server: the chosen address, else the default address, else the first. */
export const routingAddress = (addresses: ICustomerAddress[] | undefined, addressId?: string | null) => {
  if (!addresses?.length) return undefined;
  return (addressId && addresses.find(a => a.id === addressId)) || addresses.find(a => a.isDefaultAddress) || addresses[0];
};

const coordinate = (text: string | null | undefined, limit: number) => {
  if (text == null || text.trim() === '') return null;
  const value = Number(text);
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
};

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Nearest active factory with a pin; a preview of what the server stores as the suggestion on save. */
export const nearestFactory = (address: ICustomerAddress | undefined, factories: IWholesaleFactory[]) => {
  const lat = coordinate(address?.latitude, 90);
  const lng = coordinate(address?.longitude, 180);
  if (lat == null || lng == null) return undefined;
  let best: { factory: IWholesaleFactory; distanceKm: number } | undefined;
  factories.forEach(factory => {
    if (!factory.active || factory.latitude == null || factory.longitude == null) return;
    const distance = distanceKm(lat, lng, factory.latitude, factory.longitude);
    if (!best || distance < best.distanceKm) best = { factory, distanceKm: distance };
  });
  return best;
};
