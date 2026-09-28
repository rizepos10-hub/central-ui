export type WholesaleFactorySendMode = 'ALL_ROUTES_APPROVED' | 'AT_CUTOFF' | 'MANUAL';

export interface IWholesaleFactoryAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  fullAddress?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface IWholesaleFactory {
  id?: string;
  name?: string;
  code?: string | null;
  address?: IWholesaleFactoryAddress | null;
  latitude?: number | null;
  longitude?: number | null;
  /** HH:mm in the factory's time zone. */
  orderCutoffTime?: string | null;
  timeZone?: string | null;
  active?: boolean;
  sortOrder?: number | null;
  sendMode?: WholesaleFactorySendMode | null;
  fulfillmentScreenEnabled?: boolean;
}

export const SEND_MODES: { value: WholesaleFactorySendMode; label: string; description: string }[] = [
  {
    value: 'ALL_ROUTES_APPROVED',
    label: 'When all routes are approved',
    description: 'The factory order goes out as soon as every route feeding this factory is approved.',
  },
  { value: 'AT_CUTOFF', label: 'At the cut-off time', description: 'The factory order goes out at the cut-off time, approved or not.' },
  { value: 'MANUAL', label: 'Manually', description: 'A manager sends the factory order from Factory Orders.' },
];

export const sendModeLabel = (mode?: WholesaleFactorySendMode | null) => SEND_MODES.find(m => m.value === mode)?.label ?? '-';

export const DEFAULT_TIME_ZONE = 'America/Toronto';

/** Between Windsor and Toronto, for a factory that has no pin yet. */
export const DEFAULT_MAP_CENTER = { lat: 42.8, lng: -81.5 };

export const newFactory = (): IWholesaleFactory => ({
  name: '',
  code: '',
  address: { fullAddress: '' },
  latitude: null,
  longitude: null,
  orderCutoffTime: '19:00',
  timeZone: DEFAULT_TIME_ZONE,
  active: true,
  sortOrder: null,
  sendMode: 'MANUAL',
  fulfillmentScreenEnabled: true,
});

const CUTOFF = /^([01]\d|2[0-3]):[0-5]\d$/;

const blank = (value?: string | null) => value == null || value.trim() === '';

export const isValidTimeZone = (zone: string) => {
  try {
    return Boolean(new Intl.DateTimeFormat('en-US', { timeZone: zone }));
  } catch {
    return false;
  }
};

type FactoryField = 'name' | 'orderCutoffTime' | 'timeZone' | 'location';

/** The same checks central makes, so most mistakes show next to the field instead of as an error after saving. */
export const validateFactory = (factory: IWholesaleFactory): Partial<Record<FactoryField, string>> => {
  const errors: Partial<Record<FactoryField, string>> = {};
  if (blank(factory.name)) errors.name = 'Enter the factory name';
  if (!blank(factory.orderCutoffTime) && !CUTOFF.test(factory.orderCutoffTime.trim())) errors.orderCutoffTime = 'Use HH:mm, for example 19:00';
  if (!blank(factory.timeZone) && !isValidTimeZone(factory.timeZone.trim())) errors.timeZone = 'Choose the time zone from the list';
  const hasLat = factory.latitude != null;
  const hasLng = factory.longitude != null;
  if (hasLat !== hasLng) {
    errors.location = 'Set both latitude and longitude, or neither';
  } else if (hasLat && (Math.abs(factory.latitude) > 90 || Math.abs(factory.longitude) > 180)) {
    errors.location = 'Latitude or longitude is out of range';
  }
  return errors;
};

interface GoogleAddressSource {
  formatted_address?: string;
  name?: string;
  address_components?: { long_name: string; short_name: string; types: string[] }[];
}

const component = (source: GoogleAddressSource | null | undefined, type: string) =>
  source?.address_components?.find(c => c.types?.includes(type))?.long_name ?? '';

/** The factory address from a Google place or reverse-geocoding result, read the same way as the branch address. */
export const addressFromGoogle = (source: GoogleAddressSource | null | undefined): IWholesaleFactoryAddress => {
  const route = component(source, 'route');
  return {
    fullAddress: source?.formatted_address || source?.name || null,
    street: [component(source, 'street_number'), route].filter(Boolean).join(' ') || route || null,
    city: component(source, 'locality') || component(source, 'postal_town') || component(source, 'administrative_area_level_2') || null,
    state: component(source, 'administrative_area_level_1') || null,
    country: component(source, 'country') || null,
    postalCode: component(source, 'postal_code') || null,
  };
};

const trimOrNull = (value?: string | null) => (blank(value) ? null : value.trim());

/** Trims text, turns blanks into null and copies the pin onto the address, ready to send. */
export const toFactoryPayload = (factory: IWholesaleFactory): IWholesaleFactory => ({
  ...factory,
  name: factory.name?.trim(),
  code: trimOrNull(factory.code),
  orderCutoffTime: trimOrNull(factory.orderCutoffTime),
  timeZone: trimOrNull(factory.timeZone),
  address: {
    ...factory.address,
    fullAddress: trimOrNull(factory.address?.fullAddress),
    latitude: factory.latitude ?? null,
    longitude: factory.longitude ?? null,
  },
  active: factory.active ?? true,
  fulfillmentScreenEnabled: factory.fulfillmentScreenEnabled ?? false,
});
