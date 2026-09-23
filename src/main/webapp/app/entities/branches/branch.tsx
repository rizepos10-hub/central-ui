import { useAppDispatch, useAppSelector } from 'app/config/store';
import { runtimeConfig } from 'app/config/runtime-config';
import React, { useEffect, useLayoutEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getEntities, updateEntity, createEntity } from '../settings/business-details/business-detail.reducer';
import { Map, MapMouseEvent, Marker, useMap } from '@vis.gl/react-google-maps';
import {
  DeliveryPricingMode,
  KitchenPrintGrouping,
  Metric,
  UnitCostCalculationMode,
  dayTypeEnum,
  DeliveryTaggingModeEnum,
} from 'app/shared/model/business-detail.model';
import type { IBusinessDetail, IBranchDetails, IDeliveryConfiguration, IPaymentConfigurations, ITookanBookingTaskSteps } from 'app/shared/model/business-detail.model';
import { RequestType, geocode, setKey } from 'react-geocode';
import { toast } from 'react-toastify';
import _ from 'lodash';
import { PlaceAutocompleteClassic } from 'app/shared/components/google/autocomplete-classic';
import { Save, AlertTriangle, Plus, Trash2, Banknote, CreditCard, MapPin, Truck, Receipt, ExternalLink, WalletCards, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import BranchPaymentConfig from '../settings/business-details/branch-payment-config';
import Select from 'react-select'
import { getEntities as getZones } from 'app/entities/settings/zones/zones.reducer'
import { EndingType } from 'app/shared/model/ENUMS/ending-type.model';
import { EndOfDayReportSection } from 'app/shared/model/ENUMS/end-of-day-report-section.model';
import MediaLibrary from 'app/shared/components/media-library/media-library';
import { transformAttachmentStructure } from 'app/shared/util/attachment-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { IAddress } from 'app/shared/model/address.model';
import allTimeZones from '../../../content/samples/all_time_zones.json';

const deliveryPricingModeLabels: Record<DeliveryPricingMode, string> = {
  [DeliveryPricingMode.COVERAGE_BASE]: 'Coverage base',
  [DeliveryPricingMode.DISTANCE_BAND_RULE]: 'Distance band rule',
  [DeliveryPricingMode.ZONE_RULE]: 'Zone rule',
};

const defaultTookanBookingTaskSteps = (): ITookanBookingTaskSteps => ({
  goingToRestaurantEnabled: true,
  pickedUpPackageEnabled: true,
  deliveredToCustomerEnabled: true,
});

const MIN_OPEN_TABLE_IDLE_TIMEOUT_SECONDS = 15;
const MAX_OPEN_TABLE_IDLE_TIMEOUT_SECONDS = 120 * 60;
const FAKE_ONLINE_CARD_MODULE_CODE = 'FAKE_ONLINE_CARD';

const normalizePaymentConfigurations = (paymentConfigurations?: IPaymentConfigurations[]) =>
  paymentConfigurations?.map(config =>
    config?.moduleCode === FAKE_ONLINE_CARD_MODULE_CODE
      ? { ...config, gateway: null }
      : config
  );

function deliveryPricingSummaryLines(dc: IDeliveryConfiguration | null | undefined) {
  if (!dc) {
    return [{ label: 'Status', value: 'Not initialized — set coverage and rates below, then save the branch.' }];
  }
  const lines: { label: string; value: string }[] = [];
  const pricingMode = dc.pricingMode ?? DeliveryPricingMode.COVERAGE_BASE;
  const maxR = dc.shipmentRange?.value;
  const maxM = dc.shipmentRange?.metric;
  if (maxR != null && Number(maxR) > 0) {
    lines.push({
      label: 'Max delivery radius',
      value: maxM ? `${maxR} ${maxM}` : `${maxR} (pick a distance unit)`,
    });
  } else {
    lines.push({
      label: 'Max delivery radius',
      value: 'Not set — configure a limit so far-away orders are rejected.',
    });
  }

  const bands = dc.definedChargeRules?.filter(Boolean).length ?? 0;
  lines.push({
    label: 'Pricing mode',
    value: deliveryPricingModeLabels[pricingMode],
  });
  lines.push({
    label: 'Distance bands',
    value: bands > 0 ? `${bands} configured` : 'Off',
  });

  const zoneRules = dc.zoneChargeRules?.filter(rule => rule?.zoneId).length ?? 0;
  lines.push({
    label: 'Zone pricing',
    value: zoneRules > 0 ? `${zoneRules} zone-specific fee(s)` : 'Off',
  });

  const step = dc.chargePerDistance;
  if (bands === 0 && step?.charge != null && step.distance?.value) {
    lines.push({
      label: 'Per-step rate',
      value: `${step.charge} per ${step.distance.value} ${step.distance?.metric ?? ''}`.trim(),
    });
  }

  if (dc.minCharge != null && Number(dc.minCharge) > 0) {
    lines.push({ label: 'Minimum delivery fee', value: String(dc.minCharge) });
  } else {
    lines.push({ label: 'Minimum delivery fee', value: 'None / zero' });
  }

  const free = dc.freeOnAmount;
  if (free != null && Number(free) > 0) {
    lines.push({ label: 'Free delivery', value: `When order subtotal ≥ ${free}` });
  } else {
    lines.push({ label: 'Free delivery', value: 'Off' });
  }

  return lines;
}

function branchHasReliableMapOrigin(address: IBranchDetails['address'] | undefined): boolean {
  const lat = address?.latitude;
  const lng = address?.longitude;
  return typeof lat === 'number' && typeof lng === 'number' && !(lat === 0 && lng === 0);
}

const DEFAULT_MAP_CENTER = { lat: 0, lng: 0 };

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleAddressSource = {
  formatted_address?: string;
  name?: string;
  address_components?: GoogleAddressComponent[];
};

function getAddressComponent(components: GoogleAddressComponent[] = [], type: string, useShortName = false): string {
  const component = components.find(item => item.types?.includes(type));
  return component ? (useShortName ? component.short_name : component.long_name) : '';
}

function buildAddressFromGoogleResult(
  source: GoogleAddressSource | null | undefined,
  coordinates?: { latitude?: number; longitude?: number }
): Partial<IAddress> {
  const components = source?.address_components ?? [];
  const streetNumber = getAddressComponent(components, 'street_number');
  const route = getAddressComponent(components, 'route');
  const street = [streetNumber, route].filter(Boolean).join(' ') || route;
  const city =
    getAddressComponent(components, 'locality') ||
    getAddressComponent(components, 'postal_town') ||
    getAddressComponent(components, 'administrative_area_level_2');
  const state = getAddressComponent(components, 'administrative_area_level_1');
  const country = getAddressComponent(components, 'country');
  const postalCode = getAddressComponent(components, 'postal_code');
  const formattedAddress = source?.formatted_address || source?.name || '';

  return {
    ...(formattedAddress ? { fullAddress: formattedAddress, address: formattedAddress } : {}),
    ...(street ? { street } : {}),
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(country ? { country } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(typeof coordinates?.latitude === 'number' ? { latitude: coordinates.latitude } : {}),
    ...(typeof coordinates?.longitude === 'number' ? { longitude: coordinates.longitude } : {}),
  };
}

function getPlaceCoordinates(place: google.maps.places.PlaceResult | null): { latitude?: number; longitude?: number } {
  const lat = place?.geometry?.location?.lat?.();
  const lng = place?.geometry?.location?.lng?.();
  return {
    latitude: typeof lat === 'number' ? lat : undefined,
    longitude: typeof lng === 'number' ? lng : undefined,
  };
}

function getMapEventCoordinates(e: MapMouseEvent): { latitude?: number; longitude?: number } {
  const latLng = e.detail.latLng as any;
  const latValue = latLng?.lat;
  const lngValue = latLng?.lng;
  const latitude = typeof latValue === 'function' ? latValue() : latValue;
  const longitude = typeof lngValue === 'function' ? lngValue() : lngValue;

  return {
    latitude: typeof latitude === 'number' ? latitude : undefined,
    longitude: typeof longitude === 'number' ? longitude : undefined,
  };
}

/** Inner section tabs: Details, Address, Delivery pricing, … */
const BRANCH_SECTION_COUNT = 6;

function parseBranchesLocationHash(): { branch: number; section: number } | null {
  if (typeof window === 'undefined') return null;
  const h = window.location.hash.replace(/^#/, '').trim();
  if (!h) return null;
  const m = h.match(/^b(\d+)-s(\d+)$/i);
  if (!m) return null;
  return { branch: Number(m[1]), section: Number(m[2]) };
}

function buildBranchesLocationHash(branch: number, section: number): string {
  return `#b${branch}-s${section}`;
}

function clampBranchesHash(parsed: { branch: number; section: number }, branchCount: number) {
  if (branchCount <= 0) return null;
  const branch = Math.min(Math.max(0, parsed.branch), branchCount - 1);
  const section = Math.min(Math.max(0, parsed.section), BRANCH_SECTION_COUNT - 1);
  return { branch, section };
}

export const Branches = () => {
  const dispatch = useAppDispatch();

  const businessDetailEntities = useAppSelector(state => state.businessDetail.entities);
  const businessDetailEntity = businessDetailEntities[0]
  const zones = useAppSelector(state => state.zones.entities)

  const updating = useAppSelector(state => state.businessDetail.updating);

  const isNew = businessDetailEntity === undefined;

  const [activeIndex, setActiveIndex] = useState(0);
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);
  const [businessDetailsState, setBusinessDetailsState] = useState<IBusinessDetail>({
    businessName: '',
    slogan: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      fullAddress: '',
      longitude: 0,
      latitude: 0,
    },
    branchDetails: []
  });
  const [editingBranchPayments, setEditingBranchPayments] = useState(null);
  const [editPaymentIndex, setEditingPaymentIndex] = useState(null);

  const branchDetailsRef = useRef(businessDetailsState.branchDetails);
  branchDetailsRef.current = businessDetailsState.branchDetails;

  const applyBranchTabFromHash = useCallback(() => {
    const details = branchDetailsRef.current;
    const count = details?.length ?? 0;
    if (count === 0) return;
    const parsed = parseBranchesLocationHash();
    if (!parsed) return;
    const c = clampBranchesHash(parsed, count);
    if (!c) return;
    setActiveIndex(c.branch);
    setActiveBranchIndex(c.section);
    const br = details[c.branch];
    if (br) {
      setEditingBranchPayments(br.paymentConfigurations || []);
      setEditingPaymentIndex(c.branch);
    }
  }, []);

  const didApplyInitialBranchHash = useRef(false);
  const branchCount = businessDetailsState.branchDetails?.length ?? 0;

  useEffect(() => {
    if (branchCount === 0) {
      didApplyInitialBranchHash.current = false;
    }
  }, [branchCount]);

  useLayoutEffect(() => {
    if (branchCount === 0 || didApplyInitialBranchHash.current) return;
    didApplyInitialBranchHash.current = true;
    applyBranchTabFromHash();
  }, [branchCount, applyBranchTabFromHash]);

  useEffect(() => {
    const onHashChange = () => {
      applyBranchTabFromHash();
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [applyBranchTabFromHash]);

  useEffect(() => {
    if (branchCount === 0) return;
    const c = clampBranchesHash({ branch: activeIndex, section: activeBranchIndex }, branchCount);
    if (!c) return;
    const next = buildBranchesLocationHash(c.branch, c.section);
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${next}`);
    }
  }, [activeIndex, activeBranchIndex, branchCount]);

  const showDialog = (branch, index) => {
    setEditingBranchPayments(branch.paymentConfigurations)
    setEditingPaymentIndex(index)
  }

  const hideDialog = () => {
    setEditingBranchPayments(null)
  }

  const handleEndOfDayReportSectionChange = (branchIndex: number, selectedOptions: any) => {
    const selectedSections = selectedOptions.map((option: any) => option.value as EndOfDayReportSection);
    const newData = JSON.parse(JSON.stringify(businessDetailsState.branchDetails));
    newData[branchIndex].endOfDayReportSection = selectedSections;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleOpenTableIdleTimeoutEnabledChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].openTableIdleTimeoutEnabled = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleOpenTableIdleTimeoutSecondsChange = (branchIndex, value) => {
    const rawValue = String(value).trim();
    const parsedValue = rawValue === '' ? null : Number(rawValue);
    if (parsedValue !== null && !Number.isFinite(parsedValue)) return;

    const seconds = parsedValue === null
      ? null
      : parsedValue <= 0
        ? 0
        : Math.min(Math.max(Math.trunc(parsedValue), MIN_OPEN_TABLE_IDLE_TIMEOUT_SECONDS), MAX_OPEN_TABLE_IDLE_TIMEOUT_SECONDS);
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].openTableIdleTimeoutSeconds = seconds;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };


  const endOfDayReportSectionOptions = Object.keys(EndOfDayReportSection).map(section => ({
    value: EndOfDayReportSection[section as keyof typeof EndOfDayReportSection],
    label: EndOfDayReportSection[section as keyof typeof EndOfDayReportSection],
  }));

  const metrics = [Metric.KILOMETERS, Metric.MILES, Metric.NEUTRAL];

  // key for geocode
  setKey(runtimeConfig.GOOGLE_MAPS_API_KEY)

  useEffect(() => {
    dispatch(getEntities({})).then((res: any) => {
      const businessData = res.payload.data[0];
      setBusinessDetailsState(businessData);
      // Initialize payment configurations for the first branch
      if (businessData?.branchDetails?.length > 0) {
        const firstBranch = businessData.branchDetails[0];
        // Initialize paymentConfigurations array if it doesn't exist
        if (!firstBranch.paymentConfigurations) {
          firstBranch.paymentConfigurations = [];
        }
        setEditingBranchPayments(firstBranch.paymentConfigurations);
        setEditingPaymentIndex(0);
      }
    });
    dispatch(getZones({}))
  }, []);

  const handleGeocode = (e: MapMouseEvent, branchIndex) => {
    const { latitude, longitude } = getMapEventCoordinates(e);

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      toast.error('Could not read the selected map coordinates.');
      return;
    }

    geocode(RequestType.LATLNG, `${latitude},${longitude}`)
      .then(({ results }) => {
        const bestResult = results?.[0];

        handleBranchAddressFieldChange(
          branchIndex,
          buildAddressFromGoogleResult(bestResult, { latitude, longitude })
        );
      })
      .catch(err => (
        toast.error(`Error fetching address: ${err}`)
      ));
  }

  const handleBranchNameChange = (branchIndex, newName) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].name = newName;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleImageChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].logo = value?.[0];
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleWholesaleFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].wholesale = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleEBTEligibleFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].ebteligible = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handlePrintZeroPriceAddonsChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].printZeroPriceAddons = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleCanOrderChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].canOrder = checked === true;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleBranchSettingChange = (branchIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleRequireOnlineOrderConfirmationChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].requireOnlineOrderConfirmation = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleUseOrderPromisedTimeAsDefaultPrepChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].useOrderPromisedTimeAsDefaultPrep = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleOnlineOrderPrepTimeOptionsMinutesChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    const minutes = String(value || '')
      .split(/[,\s]+/)
      .map(part => parseInt(part, 10))
      .filter(n => Number.isFinite(n) && n > 0);
    newData[branchIndex].onlineOrderPrepTimeOptionsMinutes = minutes.length ? minutes : [15, 30, 45];
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleAutoPrintReceiptOnOnlineAcceptChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].autoPrintReceiptOnOnlineAccept = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleAutoPrintKitchenOnOnlineAcceptChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].autoPrintKitchenOnOnlineAccept = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleEnableAskOnTablePermissionsChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].enableAskOnTablePermissions = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleCashbackEnabledChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].cashbackEnabled = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleTokenExpiredFlag = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].tokenExpired = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleAddressFieldChange = (branchIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    const branch = newData[branchIndex];

    if (!branch.address) {
      branch.address = {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        fullAddress: "",
        longitude: 0,
        latitude: 0,
      };
    }
    branch.address[field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleCODChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].activeCOD = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleWalletChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].activeWallet = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleLoyaltyChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].activeLoyalty = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleBranchAddressFieldChange = (branchIndex, updates) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    const branch = newData[branchIndex];

    if (!branch.address) {
      branch.address = {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        fullAddress: "",
        longitude: 0,
        latitude: 0,
      };
    }

    Object.keys(updates).forEach(field => {
      branch.address[field] = updates[field];
    });

    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const defaultDeliveryConfiguration = () => ({
    chargePerDistance: {
      charge: 0,
      distance: {
        metric: undefined,
        value: 0,
      },
    },
    shipmentRange: {
      metric: undefined,
      value: 0,
    },
    minCharge: 0,
    pricingMode: DeliveryPricingMode.COVERAGE_BASE,
    freeOnAmount: null,
    definedChargeRules: [],
    zoneChargeRules: [],
    deliveryTaggingMode: DeliveryTaggingModeEnum.UNRESTRICTED,
    defaultBookingLeadMinutes: null,
    tookanBookingTaskSteps: defaultTookanBookingTaskSteps(),
    tookanBookingEnabled: true,
  });

  const withDeliveryConfigurationDefaults = (deliveryConfiguration?: IDeliveryConfiguration | null) => {
    if (!deliveryConfiguration) {
      return null;
    }
    const defaults = defaultDeliveryConfiguration();

    return {
      ...defaults,
      ...deliveryConfiguration,
      chargePerDistance: {
        ...defaults.chargePerDistance,
        ...(deliveryConfiguration.chargePerDistance ?? {}),
        distance: {
          ...defaults.chargePerDistance.distance,
          ...(deliveryConfiguration.chargePerDistance?.distance ?? {}),
        },
      },
      shipmentRange: {
        ...defaults.shipmentRange,
        ...(deliveryConfiguration.shipmentRange ?? {}),
      },
      definedChargeRules: Array.isArray(deliveryConfiguration.definedChargeRules) ? deliveryConfiguration.definedChargeRules : [],
      zoneChargeRules: Array.isArray(deliveryConfiguration.zoneChargeRules) ? deliveryConfiguration.zoneChargeRules : [],
      deliveryTaggingMode: deliveryConfiguration.deliveryTaggingMode ?? DeliveryTaggingModeEnum.UNRESTRICTED,
      defaultBookingLeadMinutes: deliveryConfiguration.defaultBookingLeadMinutes ?? null,
      tookanBookingTaskSteps: {
        ...defaultTookanBookingTaskSteps(),
        ...(deliveryConfiguration.tookanBookingTaskSteps ?? {}),
      },
      tookanBookingEnabled: deliveryConfiguration.tookanBookingEnabled !== false,
    };
  };

  const handleDeliveryConfiguration = (branchIndex, field, value) => {
    setBusinessDetailsState(prevState => {
      const newState = _.cloneDeep(prevState);

      if (!newState.branchDetails[branchIndex].deliveryConfiguration) {
        newState.branchDetails[branchIndex].deliveryConfiguration = defaultDeliveryConfiguration();
      }

      _.set(newState.branchDetails[branchIndex].deliveryConfiguration, field, value);
      return newState;
    });
  };


  const handleOpeningHourInputChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleAddOpeningHour = (branchIndex, dayIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.push({ from: '', to: '', dayType: 'TODAY' });
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleRemoveOpeningHour = (branchIndex, dayIndex, hourIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours.splice(hourIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleShiftInputChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };
  const handleAddShiftsHour = (branchIndex, dayIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts.push({ from: '', to: '' });
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleRemoveShiftsHour = (branchIndex, dayIndex, hourIndex) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].shifts.splice(hourIndex, 1);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleTimeZoneChange = (selectedTimeZone, branchIndex) => {
    setBusinessDetailsState((prev) => ({
      ...prev, branchDetails: prev.branchDetails.map((branch, i) => {
        if (i === branchIndex) {
          return { ...branch, timeZone: selectedTimeZone?.ZoneId || null };
        }
        return branch;
      })
    }));
  };

  const handleEndingTypeChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].endingType = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleSelectedDayTypeChange = (branchIndex, dayIndex, hourIndex, field, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].days[dayIndex].openingHours[hourIndex][field] = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const handleUnitCostCalculationModeChange = (branchIndex, value) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].unitCostCalculationMode = value;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  };

  const saveEntity = () => {
    const entity: IBusinessDetail = {
      ...businessDetailEntity,
      branchDetails: businessDetailsState?.branchDetails?.map(branch => ({
        ...branch,
        // Fake card is identified by moduleCode. Its legacy gateway field must
        // stay null or older Central deployments reject the whole update.
        paymentConfigurations: normalizePaymentConfigurations(branch.paymentConfigurations),
        deliveryConfiguration: withDeliveryConfigurationDefaults(branch.deliveryConfiguration),
      })),
    };

    if (isNew) {
      dispatch(createEntity(entity)).then(() => {
        dispatch(getEntities({}));
      });
    } else {
      dispatch(updateEntity(entity)).then(() => {
        dispatch(getEntities({}));
      });
    }
  };

  const handleSavePayments = () => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[editPaymentIndex].paymentConfigurations = normalizePaymentConfigurations(editingBranchPayments || []);
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
    hideDialog();
  }

  const handlePaymentConfigChange = (branchIndex: number, paymentConfigs: any[]) => {
    const normalizedPaymentConfigs = normalizePaymentConfigurations(paymentConfigs) || [];
    setBusinessDetailsState(prev => ({
      ...prev,
      branchDetails: prev.branchDetails?.map((branch, index) =>
        index === branchIndex
          ? { ...branch, paymentConfigurations: normalizedPaymentConfigs }
          : branch
      ),
    }));
  }

  const handleAddChargeRule = (branchIndex) => {
    setBusinessDetailsState((prev) => {
      const newState = _.cloneDeep(prev);
      const branch = newState.branchDetails[branchIndex];
      if (!branch.deliveryConfiguration) {
        branch.deliveryConfiguration = defaultDeliveryConfiguration();
      }
      if (!branch.deliveryConfiguration.definedChargeRules) {
        branch.deliveryConfiguration.definedChargeRules = [];
      }
      branch.deliveryConfiguration.definedChargeRules.push({
        minDistance: {
          value: 0,
          metric: Metric.KILOMETERS,
        },
        maxDistance: {
          value: 0,
          metric: Metric.KILOMETERS,
        },
        charge: 0,
        orderAmount: 0,
      });
      return newState;
    });
  };

  const handleDetailsChange = (index: number, branch: any, branchIndex: number) => {
    setEditingPaymentIndex(branchIndex)
    setActiveBranchIndex(index)
    setEditingBranchPayments(branch.paymentConfigurations || [])
  }

  const handleDeleteChargeRule = (branchIndex, chargeRuleIndex) => {
    setBusinessDetailsState((prev) => {
      const newState = _.cloneDeep(prev);
      const rules = newState.branchDetails[branchIndex].deliveryConfiguration?.definedChargeRules;
      if (rules) {
        rules.splice(chargeRuleIndex, 1);
      }
      return newState;
    });
  };

  const handleAddZoneChargeRule = (branchIndex) => {
    setBusinessDetailsState((prev) => {
      const newState = _.cloneDeep(prev);
      const branch = newState.branchDetails[branchIndex];
      if (!branch.deliveryConfiguration) {
        branch.deliveryConfiguration = defaultDeliveryConfiguration();
      }
      if (!branch.deliveryConfiguration.zoneChargeRules) {
        branch.deliveryConfiguration.zoneChargeRules = [];
      }
      branch.deliveryConfiguration.zoneChargeRules.push({
        zoneId: '',
        charge: 0,
      });
      return newState;
    });
  };

  const handleDeleteZoneChargeRule = (branchIndex, zoneChargeRuleIndex) => {
    setBusinessDetailsState((prev) => {
      const newState = _.cloneDeep(prev);
      const rules = newState.branchDetails[branchIndex].deliveryConfiguration?.zoneChargeRules;
      if (rules) {
        rules.splice(zoneChargeRuleIndex, 1);
      }
      return newState;
    });
  };

  const handleHideMapOnOnlineOrderingChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].hideMapOnOnlineOrdering = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  }

  const handleHideOpeningHoursOnOnlineOrderingChange = (branchIndex, checked) => {
    const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
    newData[branchIndex].hideOpeningHoursOnOnlineOrdering = checked;
    setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
  }

  const dialogFooterTemplate = () => {
    return (
      <Button type="submit" onClick={() => handleSavePayments()} className="h-7 text-xs">
        <Save className="h-3 w-3 mr-1" />
        Save
      </Button>
    );
  };

  return (
    <PageWrapper>
      <Tabs
        value={String(activeIndex)}
        onValueChange={(v) => {
          const index = Number(v);
          setActiveIndex(index);
          const branch = businessDetailsState?.branchDetails?.[index];
          if (branch) {
            // Update payment configurations when switching branches
            const paymentConfigs = branch.paymentConfigurations || [];
            setEditingBranchPayments(paymentConfigs);
            setEditingPaymentIndex(index);

            // Initialize paymentConfigurations array if it doesn't exist
            if (!branch.paymentConfigurations) {
              const newData = JSON.parse(JSON.stringify(businessDetailsState?.branchDetails));
              newData[index].paymentConfigurations = [];
              setBusinessDetailsState((prev) => ({ ...prev, branchDetails: newData }));
            }
          }
        }}
        className="flex items-start gap-4"
        orientation="vertical"
      >
        <TabsList className="sticky top-4 self-start h-auto max-h-[calc(100vh-2rem)] w-48 flex-col items-stretch justify-start overflow-y-auto bg-muted/30">
          {businessDetailsState?.branchDetails?.map((branch, index) => (
            <TabsTrigger
              key={index}
              value={String(index)}
              className="justify-start text-xs h-9 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {branch.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1">
          {businessDetailsState?.branchDetails?.map((branch, branchIndex) => (
            <TabsContent
              key={branchIndex}
              value={String(branchIndex)}
              className="mt-0"
            >
            <Tabs value={String(activeBranchIndex)} onValueChange={(v) => handleDetailsChange(Number(v), branch, branchIndex)} className='w-100'>
              <TabsList className="h-9 w-full justify-start">
                <TabsTrigger value="0" className="text-xs h-7">Details</TabsTrigger>
                <TabsTrigger value="1" className="text-xs h-7">Address</TabsTrigger>
                <TabsTrigger value="2" className="text-xs h-7">Delivery pricing</TabsTrigger>
                <TabsTrigger value="3" className="text-xs h-7">Opening Hours</TabsTrigger>
                <TabsTrigger value="4" className="text-xs h-7">Inventory Settings</TabsTrigger>
                <TabsTrigger value="5" className="text-xs h-7">Payment Configuration</TabsTrigger>
              </TabsList>
              <TabsContent value="0">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Branch Name</Label>
                    <Input
                      type="text"
                      value={branch.name || ''}
                      onChange={(e) => handleBranchNameChange(branchIndex, e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Image</Label>
                    <MediaLibrary
                      handleFilesSelectCallback={files =>
                        handleImageChange(
                          branchIndex,
                          transformAttachmentStructure(files, 'toIAttachment')
                        )
                      }
                      defaultValues={transformAttachmentStructure(branch.logo ? [branch.logo] : [], 'toFileLibraryListItem')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.wholesale}
                      onCheckedChange={(checked) => handleWholesaleFlag(branchIndex, checked)}
                      id={`wholesale-${branchIndex}`}
                    />
                    <Label htmlFor={`wholesale-${branchIndex}`} className="font-bold text-xs cursor-pointer">Is Wholesale</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.ebteligible}
                      onCheckedChange={(checked) => handleEBTEligibleFlag(branchIndex, checked)}
                      id={`ebt-${branchIndex}`}
                    />
                    <Label htmlFor={`ebt-${branchIndex}`} className="font-bold text-xs cursor-pointer">Is EBT Eligible</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.printZeroPriceAddons}
                      onCheckedChange={(checked) => handlePrintZeroPriceAddonsChange(branchIndex, checked)}
                      id={`print-zero-price-addons-${branchIndex}`}
                    />
                    <Label htmlFor={`print-zero-price-addons-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Print Zero Price Addons
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.cashbackEnabled !== false}
                      onCheckedChange={(checked) => handleCashbackEnabledChange(branchIndex, checked === true)}
                      id={`cashback-enabled-${branchIndex}`}
                    />
                    <Label htmlFor={`cashback-enabled-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Enable Cash Back on POS
                    </Label>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label className="font-bold text-xs">Kitchen ticket grouping</Label>
                    <ShadSelect
                      value={branch.kitchenPrintGrouping || KitchenPrintGrouping.TIMESTAMP}
                      onValueChange={(value) => handleBranchSettingChange(branchIndex, 'kitchenPrintGrouping', value)}
                    >
                      <SelectTrigger className="h-7 text-xs w-48">
                        <SelectValue placeholder="Grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(KitchenPrintGrouping).map(grouping => (
                          <SelectItem key={grouping} value={grouping} className="text-xs">
                            {grouping === KitchenPrintGrouping.NONE ? 'None' : grouping === KitchenPrintGrouping.SEAT ? 'Seat' : grouping === KitchenPrintGrouping.COURSE ? 'Course' : 'Timestamp'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadSelect>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.printKitchenItemReconciliation}
                      onCheckedChange={(checked) => handleBranchSettingChange(branchIndex, 'printKitchenItemReconciliation', checked === true)}
                      id={`print-kitchen-reconciliation-${branchIndex}`}
                    />
                    <Label htmlFor={`print-kitchen-reconciliation-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Print kitchen item reconciliation
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.forceSendingByCourse}
                      onCheckedChange={(checked) => handleBranchSettingChange(branchIndex, 'forceSendingByCourse', checked === true)}
                      id={`force-sending-by-course-${branchIndex}`}
                    />
                    <Label htmlFor={`force-sending-by-course-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Force sending by course
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.sendToKitchenOnPayButtonClick}
                      onCheckedChange={(checked) => handleBranchSettingChange(branchIndex, 'sendToKitchenOnPayButtonClick', checked === true)}
                      id={`send-kitchen-on-pay-${branchIndex}`}
                    />
                    <Label htmlFor={`send-kitchen-on-pay-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Send to kitchen on pay button click
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.skipShiftReportOnClockOut}
                      onCheckedChange={(checked) => handleBranchSettingChange(branchIndex, 'skipShiftReportOnClockOut', checked === true)}
                      id={`skip-shift-report-${branchIndex}`}
                    />
                    <Label htmlFor={`skip-shift-report-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Skip shift report on clock out
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.forcePrintEosReport !== false}
                      onCheckedChange={(checked) => handleBranchSettingChange(branchIndex, 'forcePrintEosReport', checked === true)}
                      id={`force-print-eos-${branchIndex}`}
                    />
                    <Label htmlFor={`force-print-eos-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Force print EOS report
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.clockInWithPinOnly}
                      onCheckedChange={(checked) => handleBranchSettingChange(branchIndex, 'clockInWithPinOnly', checked === true)}
                      id={`clock-in-pin-only-${branchIndex}`}
                    />
                    <Label htmlFor={`clock-in-pin-only-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Clock-in with PIN only
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.requireOnlineOrderConfirmation !== false}
                      onCheckedChange={(checked) => handleRequireOnlineOrderConfirmationChange(branchIndex, checked)}
                      id={`require-online-order-confirmation-${branchIndex}`}
                    />
                    <Label htmlFor={`require-online-order-confirmation-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Require online order confirmation
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.canOrder !== false}
                      onCheckedChange={(checked) => handleCanOrderChange(branchIndex, checked)}
                      id={`can-order-${branchIndex}`}
                    />
                    <Label htmlFor={`can-order-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Allow online ordering
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.useOrderPromisedTimeAsDefaultPrep !== false}
                      onCheckedChange={(checked) => handleUseOrderPromisedTimeAsDefaultPrepChange(branchIndex, checked)}
                      id={`use-order-promised-time-default-${branchIndex}`}
                    />
                    <Label htmlFor={`use-order-promised-time-default-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Use order promised time as default prep option
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`online-order-prep-minutes-${branchIndex}`} className="font-bold text-xs">
                      Online order prep time options (minutes, comma-separated)
                    </Label>
                    <Input
                      id={`online-order-prep-minutes-${branchIndex}`}
                      type="text"
                      className="h-7 text-xs"
                      defaultValue={(branch.onlineOrderPrepTimeOptionsMinutes || [15, 30, 45]).join(', ')}
                      key={`prep-minutes-${branch.branchId}-${(branch.onlineOrderPrepTimeOptionsMinutes || []).join('-')}`}
                      onBlur={(e) => handleOnlineOrderPrepTimeOptionsMinutesChange(branchIndex, e.target.value)}
                      placeholder="15, 30, 45"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.autoPrintReceiptOnOnlineAccept !== false}
                      onCheckedChange={(checked) => handleAutoPrintReceiptOnOnlineAcceptChange(branchIndex, checked)}
                      id={`auto-print-receipt-online-${branchIndex}`}
                    />
                    <Label htmlFor={`auto-print-receipt-online-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Print receipt on online order accept
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.autoPrintKitchenOnOnlineAccept !== false}
                      onCheckedChange={(checked) => handleAutoPrintKitchenOnOnlineAcceptChange(branchIndex, checked)}
                      id={`auto-print-kitchen-online-${branchIndex}`}
                    />
                    <Label htmlFor={`auto-print-kitchen-online-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Print kitchen ticket on online order accept
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.enableAskOnTablePermissions}
                      onCheckedChange={(checked) => handleEnableAskOnTablePermissionsChange(branchIndex, checked)}
                      id={`ask-on-table-permissions-${branchIndex}`}
                    />
                    <Label htmlFor={`ask-on-table-permissions-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Ask for permissions when opening a table
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Ending Type</Label>
                    <Select
                      value={{ label: branch.endingType, value: branch.endingType }}
                      options={Object.values(EndingType).map(type => ({ label: type, value: type }))}
                      getOptionLabel={option => option.label}
                      getOptionValue={option => option.value}
                      onChange={(selectedOption) => handleEndingTypeChange(branchIndex, selectedOption?.value)}
                      placeholder="Select Ending Type.."
                      className="text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Show End Of Day Report Section</Label>
                    <Select
                      isMulti
                      value={branch.endOfDayReportSection?.map(section => ({ value: section, label: section }))}
                      onChange={(selectedOptions) => handleEndOfDayReportSectionChange(branchIndex, selectedOptions)}
                      options={endOfDayReportSectionOptions}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!!branch.openTableIdleTimeoutEnabled}
                      onCheckedChange={(checked) => handleOpenTableIdleTimeoutEnabledChange(branchIndex, checked === true)}
                      id={`open-table-idle-timeout-${branchIndex}`}
                    />
                    <Label htmlFor={`open-table-idle-timeout-${branchIndex}`} className="font-bold text-xs cursor-pointer">
                      Open table idle timeout
                    </Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`open-table-idle-timeout-seconds-${branchIndex}`} className="font-bold text-xs">
                      Open table idle timeout (seconds)
                    </Label>
                    <Input
                      id={`open-table-idle-timeout-seconds-${branchIndex}`}
                      type="number"
                      min={0}
                      max={MAX_OPEN_TABLE_IDLE_TIMEOUT_SECONDS}
                      step={1}
                      value={branch.openTableIdleTimeoutSeconds ?? ''}
                      onChange={(e) => handleOpenTableIdleTimeoutSecondsChange(branchIndex, e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={branch.tokenExpired}
                      onCheckedChange={(checked) => handleTokenExpiredFlag(branchIndex, checked)}
                      id={`token-${branchIndex}`}
                    />
                    <Label htmlFor={`token-${branchIndex}`} className="font-bold text-xs cursor-pointer">Should token expire?</Label>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="font-bold text-xs">Time Zone</Label>
                    <Select
                      value={allTimeZones.find(tz => tz.ZoneId === branch.timeZone)}
                      options={allTimeZones}
                      getOptionLabel={option => `${option.Continent}/${option.City} (${option.ZoneId})`}
                      getOptionValue={option => option.ZoneId}
                      onChange={(selectedTz) => handleTimeZoneChange(selectedTz, branchIndex)}
                      placeholder="Select time zone..."
                      isClearable
                      isSearchable
                      className="text-xs"
                    />
                  </div>

                </div>
              </TabsContent>
              <TabsContent value="1">
                <Alert className="mb-4 border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                  <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Delivery distance</span> is calculated from this branch to the customer (Google Distance Matrix).
                    Pin the branch on the map or enter <strong>latitude / longitude</strong> for the most accurate fees; address text alone is less reliable.
                  </AlertDescription>
                </Alert>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                  <div className="min-w-0 space-y-2">
                    <Label className="font-bold text-xs">Branch Address</Label>
                    <MapComponent
                      branch={branch}
                      branchIndex={branchIndex}
                      handleGeocode={handleGeocode}
                      handleBranchAddressFieldChange={handleBranchAddressFieldChange}
                    />
                  </div>
                  <div className="min-w-0 space-y-3 rounded-md border bg-muted/10 p-3">
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-xs">Full Address</Label>
                      <Input
                        type="text"
                        placeholder="Search or enter full address"
                        value={branch.address?.fullAddress || branch.address?.address || ''}
                        onChange={(e) => {
                          handleBranchAddressFieldChange(branchIndex, {
                            fullAddress: e.target.value,
                            address: e.target.value,
                          });
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">Street</Label>
                        <Input
                          type="text"
                          placeholder="Enter Street"
                          value={branch.address?.street || ''}
                          onChange={(e) => handleAddressFieldChange(branchIndex, 'street', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">City</Label>
                        <Input
                          type="text"
                          placeholder="Enter City"
                          value={branch.address?.city || ''}
                          onChange={(e) => handleAddressFieldChange(branchIndex, 'city', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">State</Label>
                        <Input
                          type="text"
                          placeholder="Enter State"
                          value={branch.address?.state || ''}
                          onChange={(e) => handleAddressFieldChange(branchIndex, 'state', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">Country</Label>
                        <Input
                          type="text"
                          placeholder="Enter Country"
                          value={branch.address?.country || ''}
                          onChange={(e) => handleAddressFieldChange(branchIndex, 'country', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">Postal Code</Label>
                        <Input
                          type="text"
                          placeholder="Enter Postal Code"
                          value={branch.address?.postalCode || ''}
                          onChange={(e) => handleAddressFieldChange(branchIndex, 'postalCode', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">Email</Label>
                        <Input
                          type="text"
                          placeholder="Enter Email"
                          value={branch.address?.email || ''}
                          onChange={(e) => handleAddressFieldChange(branchIndex, 'email', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="font-bold text-xs">Phone Number</Label>
                        <Input
                          type="text"
                          placeholder="Enter Phone Number"
                          value={branch.address?.phoneNumber || ''}
                          onChange={(e) => handleAddressFieldChange(branchIndex, 'phoneNumber', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <Label className="font-bold text-xs">Latitude</Label>
                          <Input
                            type="number"
                            placeholder="Latitude"
                            value={branch.address?.latitude ?? ''}
                            onChange={(e) =>
                              handleAddressFieldChange(branchIndex, 'latitude', e.target.value === '' ? undefined : Number(e.target.value))
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="font-bold text-xs">Longitude</Label>
                          <Input
                            type="number"
                            placeholder="Longitude"
                            value={branch.address?.longitude ?? ''}
                            onChange={(e) =>
                              handleAddressFieldChange(branchIndex, 'longitude', e.target.value === '' ? undefined : Number(e.target.value))
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        checked={branch.hideMapOnOnlineOrdering}
                        onCheckedChange={(checked) => handleHideMapOnOnlineOrderingChange(branchIndex, checked)}
                        id={`hide-map-on-online-ordering-${branchIndex}`}
                      />
                      <Label htmlFor={`hide-map-on-online-ordering-${branchIndex}`} className="font-bold text-xs cursor-pointer">Hide Map On Online Ordering</Label>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        checked={branch.hideOpeningHoursOnOnlineOrdering}
                        onCheckedChange={(checked) => handleHideOpeningHoursOnOnlineOrderingChange(branchIndex, checked)}
                        id={`hide-opening-hours-on-online-ordering-${branchIndex}`}
                      />
                      <Label htmlFor={`hide-opening-hours-on-online-ordering-${branchIndex}`} className="font-bold text-xs cursor-pointer">Hide Opening Hours On Online Ordering</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="2">
                <div className="flex flex-col gap-6">
                  <div className="w-full min-w-0 space-y-4">
                    <Alert className="border-muted bg-muted/20">
                      <Truck className="h-4 w-4 shrink-0" />
                      <AlertDescription className="text-xs leading-relaxed text-muted-foreground space-y-2">
                        <p>
                          Configure <strong>customer delivery fees</strong> (distance-based). The same rules apply whether you dispatch with Tookan or
                          Icabbi — pricing is stored as the <code className="rounded bg-muted px-1 py-0.5 text-[10px]">DELIVERY_PRICING</code> setting
                          for this branch (and overrides the tenant default when present).
                        </p>
                        <p>
                          <strong>Platform / provider fees</strong> (e.g. per-order surcharges) are separate: configure them under{' '}
                          <Link to="/service-charge" className="font-medium text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5">
                            Service charges <ExternalLink className="h-3 w-3" />
                          </Link>{' '}
                          using charge type <code className="rounded bg-muted px-1 py-0.5 text-[10px]">PLATFORM_FEE</code> and the matching delivery
                          provider.
                        </p>
                      </AlertDescription>
                    </Alert>

                    {!branchHasReliableMapOrigin(branch.address) && (
                      <Alert>
                        <MapPin className="h-4 w-4 shrink-0" />
                        <AlertDescription className="text-xs">
                          This branch has no map coordinates yet. Open the <strong>Address</strong> tab and set the pin (or lat/long) so distance-based
                          fees calculate correctly.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                    <div className="min-w-0 flex-1 space-y-4">
                  <RadioGroup
                    value={branch.deliveryConfiguration?.pricingMode ?? DeliveryPricingMode.COVERAGE_BASE}
                    onValueChange={(value) => handleDeliveryConfiguration(branchIndex, 'pricingMode', value)}
                    className="space-y-4"
                  >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card className={branch.deliveryConfiguration?.pricingMode === DeliveryPricingMode.COVERAGE_BASE || !branch.deliveryConfiguration?.pricingMode ? 'border-primary ring-1 ring-primary/20' : ''}>
                      <CardHeader className="space-y-1 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <CardTitle className="text-sm font-semibold">Coverage</CardTitle>
                            <CardDescription className="text-[11px]">Maximum delivery radius and how delivery is classified for routing.</CardDescription>
                          </div>
                          <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1">
                            <Label htmlFor={`pricing-mode-card-${branchIndex}-coverage`} className="cursor-pointer text-[11px] font-medium">
                              Active
                            </Label>
                            <RadioGroupItem
                              value={DeliveryPricingMode.COVERAGE_BASE}
                              id={`pricing-mode-card-${branchIndex}-coverage`}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-md border bg-muted/10 p-3 space-y-3">
                          <p className="text-[11px] font-medium text-foreground">Max delivery distance</p>
                          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                            <div className="flex min-w-[7rem] flex-1 flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Radius</Label>
                              <Input
                                type="number"
                                placeholder="e.g. 8"
                                value={branch.deliveryConfiguration?.shipmentRange?.value ?? ''}
                                onChange={(e) =>
                                  handleDeliveryConfiguration(branchIndex, 'shipmentRange.value', Number(e.target.value))
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex flex-1 flex-col gap-2">
                              <Label className="text-xs text-muted-foreground">Unit</Label>
                              <RadioGroup
                                value={branch.deliveryConfiguration?.shipmentRange?.metric}
                                onValueChange={(value) => handleDeliveryConfiguration(branchIndex, 'shipmentRange.metric', value)}
                                className="flex flex-wrap gap-3"
                              >
                                {metrics.map((metric, idx) => (
                                  <div className="flex items-center gap-2" key={idx}>
                                    <RadioGroupItem value={metric} id={`shipment-metric-${branchIndex}-${idx}`} />
                                    <Label htmlFor={`shipment-metric-${branchIndex}-${idx}`} className="cursor-pointer text-xs font-normal">
                                      {metric}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={branch.deliveryConfiguration?.pricingMode === DeliveryPricingMode.COVERAGE_BASE || !branch.deliveryConfiguration?.pricingMode ? 'border-primary/60 bg-primary/5' : ''}>
                      <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-sm font-semibold">Base rates</CardTitle>
                        <CardDescription className="text-[11px]">
                          Per-unit distance charge and a floor for the delivery fee when no band applies.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-md border bg-muted/10 p-3 space-y-3">
                          <p className="text-[11px] font-medium text-foreground">Charge per distance step</p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Step size</Label>
                              <Input
                                type="number"
                                placeholder="Distance per step"
                                value={branch.deliveryConfiguration?.chargePerDistance?.distance?.value ?? ''}
                                onChange={(e) =>
                                  handleDeliveryConfiguration(
                                    branchIndex,
                                    'chargePerDistance.distance.value',
                                    Number(e.target.value)
                                  )
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-xs text-muted-foreground">Charge per step</Label>
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={branch.deliveryConfiguration?.chargePerDistance?.charge ?? ''}
                                onChange={(e) =>
                                  handleDeliveryConfiguration(branchIndex, 'chargePerDistance.charge', Number(e.target.value))
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label className="text-xs text-muted-foreground">Step unit</Label>
                            <RadioGroup
                              value={branch.deliveryConfiguration?.chargePerDistance?.distance?.metric}
                              onValueChange={(value) =>
                                handleDeliveryConfiguration(branchIndex, 'chargePerDistance.distance.metric', value)
                              }
                              className="flex flex-wrap gap-3"
                            >
                              {metrics.map((metric, idx) => (
                                <div className="flex items-center gap-2" key={idx}>
                                  <RadioGroupItem value={metric} id={`charge-metric-${branchIndex}-${idx}`} />
                                  <Label htmlFor={`charge-metric-${branchIndex}-${idx}`} className="cursor-pointer text-xs font-normal">
                                    {metric}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs font-medium">Minimum delivery charge</Label>
                          <Input
                            type="number"
                            placeholder="Minimum fee"
                            value={branch.deliveryConfiguration?.minCharge ?? ''}
                            onChange={(e) => handleDeliveryConfiguration(branchIndex, 'minCharge', Number(e.target.value))}
                            className="h-8 text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">Applied as a floor when calculating delivery cost.</p>
                        </div>
                        <div className="flex flex-col gap-1 rounded-md border border-dashed bg-muted/5 p-3">
                          <Label className="text-xs font-medium">Free delivery threshold (order subtotal)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="e.g. 50 — leave empty to disable"
                            value={
                              branch.deliveryConfiguration?.freeOnAmount != null
                                ? String(branch.deliveryConfiguration.freeOnAmount)
                                : ''
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              if (raw === '') {
                                handleDeliveryConfiguration(branchIndex, 'freeOnAmount', null);
                                return;
                              }
                              const n = Number(raw);
                              handleDeliveryConfiguration(branchIndex, 'freeOnAmount', Number.isFinite(n) ? n : null);
                            }}
                            className="h-8 text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            When the cart subtotal is <strong>≥</strong> this amount, the <strong>distance delivery fee</strong> becomes zero. Does
                            not remove service charges (e.g. platform fees) — those are configured separately.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className={branch.deliveryConfiguration?.pricingMode === DeliveryPricingMode.DISTANCE_BAND_RULE ? 'border-primary ring-1 ring-primary/20' : ''}>
                    <CardHeader className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-semibold">Distance bands</CardTitle>
                        <CardDescription className="text-[11px]">
                          Optional tiers: set min/max distance, fee, and optional minimum order for each band. Bands are evaluated in order.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1">
                          <Label htmlFor={`pricing-mode-card-${branchIndex}-distance`} className="cursor-pointer text-[11px] font-medium">
                            Active
                          </Label>
                          <RadioGroupItem
                            value={DeliveryPricingMode.DISTANCE_BAND_RULE}
                            id={`pricing-mode-card-${branchIndex}-distance`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 gap-1 text-xs"
                          onClick={() => handleAddChargeRule(branchIndex)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add band
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {(branch.deliveryConfiguration?.definedChargeRules?.length ?? 0) === 0 ? (
                        <div className="rounded-md border border-dashed bg-muted/10 px-4 py-8 text-center">
                          <p className="text-xs text-muted-foreground">
                            No bands yet. Use “Add band” for stepped pricing (e.g. 0–3 km = $5, 3–6 km = $8).
                          </p>
                        </div>
                      ) : (
                        (branch.deliveryConfiguration?.definedChargeRules ?? []).map((chargeRule, chargeRuleIndex) => (
                          <div
                            key={chargeRuleIndex}
                            className="rounded-lg border bg-card p-3 shadow-sm space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">Band {chargeRuleIndex + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteChargeRule(branchIndex, chargeRuleIndex)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                              <div className="lg:col-span-2 flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground" htmlFor={`rule-min-${branchIndex}-${chargeRuleIndex}`}>
                                  Min distance
                                </Label>
                                <Input
                                  type="number"
                                  id={`rule-min-${branchIndex}-${chargeRuleIndex}`}
                                  placeholder="Min"
                                  value={chargeRule.minDistance.value ?? ''}
                                  onChange={(e) =>
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `definedChargeRules[${chargeRuleIndex}].minDistance.value`,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="lg:col-span-2 flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground" htmlFor={`rule-max-${branchIndex}-${chargeRuleIndex}`}>
                                  Max distance
                                </Label>
                                <Input
                                  type="number"
                                  id={`rule-max-${branchIndex}-${chargeRuleIndex}`}
                                  placeholder="Max"
                                  value={chargeRule.maxDistance.value ?? ''}
                                  onChange={(e) =>
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `definedChargeRules[${chargeRuleIndex}].maxDistance.value`,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="lg:col-span-2 flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground" htmlFor={`rule-charge-${branchIndex}-${chargeRuleIndex}`}>
                                  Charge
                                </Label>
                                <Input
                                  type="number"
                                  id={`rule-charge-${branchIndex}-${chargeRuleIndex}`}
                                  placeholder="Fee"
                                  value={chargeRule.charge ?? ''}
                                  onChange={(e) =>
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `definedChargeRules[${chargeRuleIndex}].charge`,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="lg:col-span-2 flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground" htmlFor={`rule-order-${branchIndex}-${chargeRuleIndex}`}>
                                  Min order amount
                                </Label>
                                <Input
                                  type="number"
                                  id={`rule-order-${branchIndex}-${chargeRuleIndex}`}
                                  placeholder="Optional"
                                  value={chargeRule.orderAmount ?? ''}
                                  onChange={(e) =>
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `definedChargeRules[${chargeRuleIndex}].orderAmount`,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="lg:col-span-3 flex flex-col gap-2">
                                <Label className="text-xs text-muted-foreground">Distance unit</Label>
                                <RadioGroup
                                  value={chargeRule.maxDistance.metric}
                                  onValueChange={(value) => {
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `definedChargeRules[${chargeRuleIndex}].maxDistance.metric`,
                                      value
                                    );
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `definedChargeRules[${chargeRuleIndex}].minDistance.metric`,
                                      value
                                    );
                                  }}
                                  className="flex flex-wrap gap-3"
                                >
                                  {metrics.map((metric, idx) => (
                                    <div className="flex items-center gap-2" key={idx}>
                                      <RadioGroupItem
                                        value={metric}
                                        id={`charge-rule-metric-${branchIndex}-${chargeRuleIndex}-${idx}`}
                                      />
                                      <Label
                                        htmlFor={`charge-rule-metric-${branchIndex}-${chargeRuleIndex}-${idx}`}
                                        className="cursor-pointer text-xs font-normal"
                                      >
                                        {metric}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className={branch.deliveryConfiguration?.pricingMode === DeliveryPricingMode.ZONE_RULE ? 'border-primary ring-1 ring-primary/20' : ''}>
                    <CardHeader className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-semibold">Zone charges</CardTitle>
                        <CardDescription className="text-[11px]">
                          Optional overrides: assign a flat delivery fee to specific zones using the configured zone catalog.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-2 py-1">
                          <Label htmlFor={`pricing-mode-card-${branchIndex}-zone`} className="cursor-pointer text-[11px] font-medium">
                            Active
                          </Label>
                          <RadioGroupItem
                            value={DeliveryPricingMode.ZONE_RULE}
                            id={`pricing-mode-card-${branchIndex}-zone`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 gap-1 text-xs"
                          onClick={() => handleAddZoneChargeRule(branchIndex)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add zone charge
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {(branch.deliveryConfiguration?.zoneChargeRules?.length ?? 0) === 0 ? (
                        <div className="rounded-md border border-dashed bg-muted/10 px-4 py-8 text-center">
                          <p className="text-xs text-muted-foreground">
                            No zone-specific fees yet. Add one when a zone should have its own flat delivery charge.
                          </p>
                        </div>
                      ) : (
                        (branch.deliveryConfiguration?.zoneChargeRules ?? []).map((zoneChargeRule, zoneChargeRuleIndex) => (
                          <div
                            key={zoneChargeRuleIndex}
                            className="rounded-lg border bg-card p-3 shadow-sm space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-foreground">Zone rule {zoneChargeRuleIndex + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteZoneChargeRule(branchIndex, zoneChargeRuleIndex)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                              <div className="lg:col-span-8 flex flex-col gap-1">
                                <Label className="text-xs text-muted-foreground">Zone</Label>
                                <Select
                                  value={zones.find(zone => zone.id === zoneChargeRule.zoneId) ?? null}
                                  options={zones}
                                  getOptionLabel={option => option.name}
                                  getOptionValue={option => option.id}
                                  onChange={(selectedZone) =>
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `zoneChargeRules[${zoneChargeRuleIndex}].zoneId`,
                                      selectedZone?.id ?? ''
                                    )
                                  }
                                  placeholder="Select zone..."
                                  isClearable
                                  className="text-xs"
                                />
                              </div>
                              <div className="lg:col-span-4 flex flex-col gap-1">
                                <Label
                                  className="text-xs text-muted-foreground"
                                  htmlFor={`zone-charge-${branchIndex}-${zoneChargeRuleIndex}`}
                                >
                                  Charge
                                </Label>
                                <Input
                                  type="number"
                                  id={`zone-charge-${branchIndex}-${zoneChargeRuleIndex}`}
                                  placeholder="Fee"
                                  value={zoneChargeRule.charge ?? ''}
                                  onChange={(e) =>
                                    handleDeliveryConfiguration(
                                      branchIndex,
                                      `zoneChargeRules[${zoneChargeRuleIndex}].charge`,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                  </RadioGroup>
                    </div>

                  <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-72 lg:max-w-sm lg:sticky lg:top-4 lg:self-start">
                    <Card>
                      <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-sm font-semibold">At a glance</CardTitle>
                        <CardDescription className="text-[11px]">
                          Plain-language summary of this branch&apos;s delivery fee rules (verify before saving).
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <dl className="grid gap-2 text-xs">
                          {deliveryPricingSummaryLines(branch.deliveryConfiguration).map((row) => (
                            <div key={row.label} className="rounded-md border bg-muted/20 px-3 py-2">
                              <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                              <dd className="mt-0.5 font-medium text-foreground leading-snug">{row.value}</dd>
                            </div>
                          ))}
                          <div className="rounded-md border bg-muted/20 px-3 py-2">
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tagging mode</dt>
                            <dd className="mt-2">
                              <ShadSelect
                                value={branch.deliveryConfiguration?.deliveryTaggingMode ?? DeliveryTaggingModeEnum.UNRESTRICTED}
                                onValueChange={(value) => handleDeliveryConfiguration(branchIndex, 'deliveryTaggingMode', value)}
                              >
                                <SelectTrigger className="h-8 text-xs bg-background">
                                  <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(DeliveryTaggingModeEnum).map(mode => (
                                    <SelectItem key={mode} value={mode} className="text-xs">
                                      {mode}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </ShadSelect>
                            </dd>
                          </div>
                          <div className="rounded-md border bg-muted/20 px-3 py-2">
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Default booking lead minutes
                            </dt>
                            <dd className="mt-2 space-y-2">
                              <Input
                                type="number"
                                min={0}
                                placeholder="e.g. 15"
                                value={
                                  branch.deliveryConfiguration?.defaultBookingLeadMinutes != null
                                    ? String(branch.deliveryConfiguration.defaultBookingLeadMinutes)
                                    : ''
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '') {
                                    handleDeliveryConfiguration(branchIndex, 'defaultBookingLeadMinutes', null);
                                    return;
                                  }
                                  handleDeliveryConfiguration(branchIndex, 'defaultBookingLeadMinutes', Number(raw));
                                }}
                                className="h-8 text-xs bg-background"
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Leave empty to keep this unset, or provide the default lead time in minutes for branch bookings.
                              </p>
                            </dd>
                          </div>
                          <div className="rounded-md border bg-muted/20 px-3 py-2 md:col-span-2">
                            <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tookan delivery</dt>
                            <dd className="mt-2 flex items-start gap-2">
                              <Checkbox
                                id={`tookanBookingEnabled-${branchIndex}`}
                                checked={branch.deliveryConfiguration?.tookanBookingEnabled !== false}
                                onCheckedChange={checked =>
                                  handleDeliveryConfiguration(branchIndex, 'tookanBookingEnabled', checked === true)
                                }
                              />
                              <div className="space-y-1">
                                <Label htmlFor={`tookanBookingEnabled-${branchIndex}`} className="text-xs font-semibold">
                                  Enable Tookan for this branch
                                </Label>
                                <p className="text-[10px] text-muted-foreground">
                                  When off, Tookan is inactive for this branch only (booking, fees, and provider selection). Business-level
                                  disable still overrides this.
                                </p>
                              </div>
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardHeader className="space-y-1 pb-2">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Receipt className="h-4 w-4" />
                          Related settings
                        </CardTitle>
                        <CardDescription className="text-[11px]">Complete the delivery stack in a few clicks.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-xs">
                        {/* <Link
                          to="/tookan-settings"
                          className="flex items-center justify-between rounded-md border bg-card px-3 py-2 font-medium hover:bg-muted/50 transition-colors"
                        >
                          Tookan integration
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link> */}
                        <Link
                          to="/service-charge"
                          className="flex items-center justify-between rounded-md border bg-card px-3 py-2 font-medium hover:bg-muted/50 transition-colors"
                        >
                          Service charges &amp; platform fees
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                        <p className="text-[10px] text-muted-foreground pt-1">
                          Use <strong>Address</strong> for branch coordinates used in distance calculation.
                        </p>
                      </CardContent>
                    </Card>
                  </aside>
                </div>
                </div>
              </TabsContent>
              <TabsContent value="3">
                <div>
                  <h4>Opening Hours By Branch</h4>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please ensure that opening hours are provided in the following format: <b>HH:mm:ss</b>
                    </AlertDescription>
                  </Alert>
                </div>
                <div>
                  <div className="flex flex-col gap-2">
                    {branch.days.map((day, dayIndex) => (
                      <Card key={day.day} className="flex flex-col py-2 px-3">
                        <div className="flex flex-row items-center justify-between">
                          <strong className="text-sm">{day.day}</strong>
                          <strong className="text-sm">Opens {day.day} &nbsp; {day.opensToday ? <span>&#10003;</span> : <span>&#10007;</span>}</strong>
                          <strong className="text-sm"> Status: {day.status}</strong>
                        </div>

                        <div className="border-t border-gray-300 my-3" />

                        <div className='grid grid-cols-1 md:grid-cols-12 gap-4'>
                          <div className='md:col-span-5 border-r pr-4'>
                            <Button type="button" className="my-2 h-7 text-xs" onClick={() => handleAddOpeningHour(branchIndex, dayIndex)} >
                              Add Opening Hour
                            </Button>

                            {day.openingHours.map((openingHour, hourIndex) => (
                              <div key={hourIndex} className="flex flex-row items-center mb-3 gap-2">
                                <ShadSelect
                                  value={openingHour.dayType}
                                  onValueChange={(value) => handleSelectedDayTypeChange(branchIndex, dayIndex, hourIndex, 'dayType', value)}
                                >
                                  <SelectTrigger className="h-7 text-xs w-32">
                                    <SelectValue placeholder="Day Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(dayTypeEnum).map(dayType => (
                                      <SelectItem key={dayType} value={dayType} className="text-xs">{dayType}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </ShadSelect>

                                <Label className="text-xs">From:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={openingHour.from || ''}
                                  onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Label className="text-xs">To:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={openingHour.to || ''}
                                  onChange={(e) => handleOpeningHourInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => handleRemoveOpeningHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </Button>
                              </div>
                            ))}
                          </div>
                          <div className='md:col-span-7'>
                            <div className="flex">
                              <Button type="button" className="my-2 h-7 text-xs" onClick={() => handleAddShiftsHour(branchIndex, dayIndex)}>
                                Add Shifts
                              </Button>
                            </div>
                            {day.shifts.map((shift, hourIndex) => (
                              <div key={hourIndex} className="flex flex-row items-center mb-3 gap-2">
                                <Label className="text-xs">Name:</Label>
                                <Input
                                  type="text"
                                  placeholder="Enter shift name"
                                  value={shift.shiftName || ''}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'shiftName', e.target.value)}
                                  className='w-32 h-7 text-xs'
                                />
                                <Label className="text-xs">From:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={shift.from || ''}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'from', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Label className="text-xs">To:</Label>
                                <Input
                                  type="text"
                                  placeholder="HH:mm:ss"
                                  pattern="^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$"
                                  value={shift.to || ''}
                                  onChange={(e) => handleShiftInputChange(branchIndex, dayIndex, hourIndex, 'to', e.target.value)}
                                  className='w-24 h-7 text-xs'
                                />

                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="h-7 text-xs"
                                  onClick={() => handleRemoveShiftsHour(branchIndex, dayIndex, hourIndex)}
                                >
                                  X
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="4">
                <div className='w-100'>
                  <Label className="font-semibold text-xs mb-2 block">
                    Unit Cost Rule
                  </Label>
                  <ShadSelect
                    value={branch?.unitCostCalculationMode}
                    onValueChange={(value) => handleUnitCostCalculationModeChange(branchIndex, value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(UnitCostCalculationMode).map(mode => (
                        <SelectItem key={mode} value={mode} className="text-xs">{mode}</SelectItem>
                      ))}
                    </SelectContent>
                  </ShadSelect>
                </div>
              </TabsContent>
              <TabsContent value="5">
                <div className="max-w-5xl space-y-4">
                  <Card>
                    <CardHeader className="space-y-1 pb-2">
                      <CardTitle className="text-sm font-semibold">Branch payment methods</CardTitle>
                      <CardDescription className="text-[11px] leading-relaxed">
                        Control which payment types are available at this branch. Card gateways are configured below.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <label
                        htmlFor={`cod-${branchIndex}`}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Banknote className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium leading-none">Cash on delivery (COD)</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Delivery
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug">
                            When enabled, staff and online ordering can accept cash payment to the driver at drop-off. Works with your delivery workflow and driver tagging settings.
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <Checkbox
                            checked={!!branch?.activeCOD}
                            onCheckedChange={(checked) => handleCODChange(branchIndex, checked)}
                            id={`cod-${branchIndex}`}
                            className="h-4 w-4"
                            aria-describedby={`cod-help-${branchIndex}`}
                          />
                        </div>
                      </label>
                      <p id={`cod-help-${branchIndex}`} className="text-[10px] text-muted-foreground px-1">
                        Tip: COD is independent of Converge, Bambora, and Fake card — it only toggles whether cash-on-delivery is allowed for this branch.
                      </p>

                      <label
                        htmlFor={`wallet-${branchIndex}`}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <WalletCards className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium leading-none">Wallet (store credit)</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Online ordering
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug">
                            When enabled, signed-in customers can pay from their wallet balance at online checkout. Disabling hides the option and rejects wallet payments for this branch.
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <Checkbox
                            checked={branch?.activeWallet !== false}
                            onCheckedChange={(checked) => handleWalletChange(branchIndex, checked)}
                            id={`wallet-${branchIndex}`}
                            className="h-4 w-4"
                          />
                        </div>
                      </label>

                      <label
                        htmlFor={`loyalty-${branchIndex}`}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Gift className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium leading-none">Loyalty points</span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              Online ordering
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-snug">
                            When enabled, signed-in customers can redeem loyalty points at online checkout. Requires a points-to-cash exchange rate in loyalty settings.
                          </p>
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <Checkbox
                            checked={branch?.activeLoyalty !== false}
                            onCheckedChange={(checked) => handleLoyaltyChange(branchIndex, checked)}
                            id={`loyalty-${branchIndex}`}
                            className="h-4 w-4"
                          />
                        </div>
                      </label>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="space-y-1 border-b pb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <CreditCard className="h-4 w-4" aria-hidden />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <CardTitle className="text-sm font-semibold">Card processing</CardTitle>
                          <CardDescription className="text-[11px] leading-relaxed">
                            Configure Converge Lightbox, Bambora, or Fake card payments for this branch. Fake card requires no gateway credentials.
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Tabs defaultValue="converge" className="w-full">
                        <TabsList className="mb-4 h-9 w-full justify-start sm:w-auto">
                          <TabsTrigger value="converge" className="text-xs h-7 px-3">
                            Converge
                          </TabsTrigger>
                          <TabsTrigger value="bambora" className="text-xs h-7 px-3">
                            Bambora
                          </TabsTrigger>
                          <TabsTrigger value="fake-card" className="text-xs h-7 px-3">
                            Fake card
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="converge" className="mt-0 rounded-md border bg-muted/10 p-3">
                          <BranchPaymentConfig
                            editingBranchPayments={branch.paymentConfigurations || []}
                            branchIndex={branchIndex}
                            moduleCode="CONVERGE_LIGHTBOX"
                            onPaymentConfigChange={handlePaymentConfigChange}
                          />
                        </TabsContent>
                        <TabsContent value="bambora" className="mt-0 rounded-md border bg-muted/10 p-3">
                          <BranchPaymentConfig
                            editingBranchPayments={branch.paymentConfigurations || []}
                            branchIndex={branchIndex}
                            moduleCode="BAMBORA"
                            onPaymentConfigChange={handlePaymentConfigChange}
                          />
                        </TabsContent>
                        <TabsContent value="fake-card" className="mt-0 rounded-md border bg-muted/10 p-3">
                          <BranchPaymentConfig
                            editingBranchPayments={branch.paymentConfigurations || []}
                            branchIndex={branchIndex}
                            moduleCode="FAKE_ONLINE_CARD"
                            onPaymentConfigChange={handlePaymentConfigChange}
                          />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            </TabsContent>
          ))}

          <div className="mt-4">
            <Button id="save-entity" type='button' data-cy="entityCreateSaveButton" disabled={updating} onClick={saveEntity} className='h-8 text-xs'>
              <Save className="h-4 w-4 mr-2" />
              <Translate contentKey="entity.action.save">Save</Translate>
            </Button>
          </div>
        </div>
      </Tabs>
    </PageWrapper>
  )
};

export default Branches;


const MapComponent = ({
  branch,
  branchIndex,
  handleGeocode,
  handleBranchAddressFieldChange
}: {
  branch: IBranchDetails,
  branchIndex: number,
  handleGeocode: (e: MapMouseEvent, branchIndex: number) => void,
  handleBranchAddressFieldChange: (branchIndex: number, updates: Partial<IAddress>) => void
}) => {
  const map = useMap(`map-${branchIndex}`);
  const hasCoordinates = branchHasReliableMapOrigin(branch.address);
  const mapCenter = hasCoordinates
    ? { lat: branch.address?.latitude ?? 0, lng: branch.address?.longitude ?? 0 }
    : DEFAULT_MAP_CENTER;

  useEffect(() => {
    if (!map || !hasCoordinates) return;

    map.panTo(mapCenter);
    map.setZoom(15);
  }, [hasCoordinates, map, mapCenter.lat, mapCenter.lng]);

  const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult | null) => {
    if (!place) return;

    const coordinates = getPlaceCoordinates(place);
    if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
      toast.error('The selected address did not include map coordinates.');
      return;
    }

    handleBranchAddressFieldChange(
      branchIndex,
      buildAddressFromGoogleResult(place, coordinates)
    );

    map?.panTo({ lat: coordinates.latitude, lng: coordinates.longitude });
    map?.setZoom(15);
  }, [branchIndex, handleBranchAddressFieldChange, map]);

  return (
    <div className="space-y-2 rounded-md border bg-muted/10 p-3">
      <PlaceAutocompleteClassic
        onPlaceSelect={handlePlaceSelect}
        placeholder="Search for a precise branch address"
        className="w-full"
        inputClassName="h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="h-[360px] min-h-[320px] w-full overflow-hidden rounded-md border bg-background lg:h-[520px]">
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultZoom={hasCoordinates ? 15 : 3}
          gestureHandling={'greedy'}
          disableDefaultUI={false}
          onClick={(e) => handleGeocode(e, branchIndex)}
          defaultCenter={mapCenter}
          id={`map-${branchIndex}`}
        >
          {hasCoordinates && <Marker position={mapCenter} />}
        </Map>
      </div>
    </div>
  );
};
