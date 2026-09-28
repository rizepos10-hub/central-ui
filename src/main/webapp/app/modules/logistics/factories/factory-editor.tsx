import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Map, MapMouseEvent, Marker, useMap } from '@vis.gl/react-google-maps';
import { RequestType, geocode, setKey } from 'react-geocode';
import ReactSelect from 'react-select';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlaceAutocompleteClassic } from 'app/shared/components/google/autocomplete-classic';
import { runtimeConfig } from 'app/config/runtime-config';
import allTimeZones from '../../../../content/samples/all_time_zones.json';

import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { saveFactory } from './wholesale-factory.api';
import {
  DEFAULT_MAP_CENTER,
  IWholesaleFactory,
  SEND_MODES,
  WholesaleFactorySendMode,
  addressFromGoogle,
  newFactory,
  toFactoryPayload,
  validateFactory,
} from './wholesale-factory.model';

const MAP_ID = 'wholesale-factory-map';

type TimeZoneOption = (typeof allTimeZones)[number];

const timeZoneLabel = (zone: TimeZoneOption) => `${zone.Continent}/${zone.City} (${zone.ZoneId})`;

interface FactoryEditorProps {
  /** The factory to edit, a new one when it has no id, or null when closed. */
  factory: IWholesaleFactory | null;
  readOnly: boolean;
  onClose: () => void;
  onSaved: (factory: IWholesaleFactory) => void;
}

const PanTo = ({ lat, lng }: { lat?: number | null; lng?: number | null }) => {
  const map = useMap(MAP_ID);
  useEffect(() => {
    if (map && lat != null && lng != null) map.panTo({ lat, lng });
  }, [map, lat, lng]);
  return null;
};

export const FactoryEditor = ({ factory, readOnly, onClose, onSaved }: FactoryEditorProps) => {
  const [draft, setDraft] = useState<IWholesaleFactory>(newFactory());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (factory) {
      setDraft({ ...newFactory(), ...factory, address: { ...factory.address } });
      setSubmitted(false);
    }
  }, [factory]);

  const errors = useMemo(() => validateFactory(draft), [draft]);
  const shown = submitted ? errors : {};
  const hasPin = draft.latitude != null && draft.longitude != null;

  const set = <K extends keyof IWholesaleFactory>(key: K, value: IWholesaleFactory[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  const setPin = useCallback((lat: number, lng: number) => {
    setDraft(prev => ({ ...prev, latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) }));
  }, []);

  const setGoogleAddress = useCallback((source: Parameters<typeof addressFromGoogle>[0]) => {
    setDraft(prev => ({ ...prev, address: { ...prev.address, ...addressFromGoogle(source) } }));
  }, []);

  const onMapClick = useCallback(
    (event: MapMouseEvent) => {
      const latLng = event.detail?.latLng;
      if (readOnly || !latLng) return;
      setPin(latLng.lat, latLng.lng);
      setKey(runtimeConfig.GOOGLE_MAPS_API_KEY);
      geocode(RequestType.LATLNG, `${latLng.lat},${latLng.lng}`)
        .then(({ results }) => {
          if (results?.[0]) setGoogleAddress(results[0]);
          else toast.warn('Google Maps has no address for that spot.');
        })
        .catch(() => toast.error('Google Maps could not find the address for that spot.'));
    },
    [readOnly, setPin, setGoogleAddress],
  );

  const onPlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult | null) => {
      const location = place?.geometry?.location;
      if (!place || !location) return;
      setGoogleAddress(place);
      setPin(location.lat(), location.lng());
    },
    [setPin, setGoogleAddress],
  );

  const coordinate = (key: 'latitude' | 'longitude', text: string) => {
    const value = text.trim() === '' ? null : Number(text);
    set(key, value == null || Number.isNaN(value) ? null : value);
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const saved = await saveFactory(toFactoryPayload(draft));
      toast.success(`${saved.name} saved`);
      onSaved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The factory could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={factory != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{readOnly ? draft.name : draft.id ? `Edit ${draft.name}` : 'New factory'}</DialogTitle>
          <DialogDescription>
            Where the factory is, when it stops taking orders for the next delivery day, and how its order is sent.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <fieldset disabled={readOnly || saving} className="grid content-start gap-3">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="factory-name">Name</Label>
                <Input id="factory-name" className="ws-control" value={draft.name ?? ''} onChange={e => set('name', e.target.value)} />
                {shown.name && <span className="text-xs text-destructive">{shown.name}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="factory-code">Code</Label>
                <Input
                  id="factory-code"
                  className="ws-control ws-mono"
                  placeholder="WIN"
                  value={draft.code ?? ''}
                  onChange={e => set('code', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Address</Label>
              {!readOnly && (
                <PlaceAutocompleteClassic
                  onPlaceSelect={onPlaceSelect}
                  placeholder="Search the address on Google Maps"
                  className="w-full"
                  inputClassName="ws-control w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
              <span data-testid="factory-address" className={draft.address?.fullAddress ? 'text-sm' : 'text-xs text-muted-foreground'}>
                {draft.address?.fullAddress || (readOnly ? 'No address' : 'Pick the address from the search or click the map.')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="factory-cutoff">Order cut-off</Label>
                <Input
                  id="factory-cutoff"
                  type="time"
                  className="ws-control ws-mono"
                  value={draft.orderCutoffTime ?? ''}
                  onChange={e => set('orderCutoffTime', e.target.value)}
                />
                {shown.orderCutoffTime && <span className="text-xs text-destructive">{shown.orderCutoffTime}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="factory-zone">Time zone</Label>
                <ReactSelect<TimeZoneOption>
                  inputId="factory-zone"
                  value={allTimeZones.find(zone => zone.ZoneId === draft.timeZone) ?? null}
                  options={allTimeZones}
                  getOptionLabel={timeZoneLabel}
                  getOptionValue={zone => zone.ZoneId}
                  onChange={zone => set('timeZone', zone?.ZoneId ?? null)}
                  isDisabled={readOnly || saving}
                  isSearchable
                  isClearable
                  placeholder="Search a city or zone"
                  styles={{ menu: base => ({ ...base, zIndex: 60 }), control: base => ({ ...base, fontSize: 14 }) }}
                />
                {shown.timeZone && <span className="text-xs text-destructive">{shown.timeZone}</span>}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Send the factory order</Label>
              <Select
                value={draft.sendMode ?? 'MANUAL'}
                onValueChange={value => set('sendMode', value as WholesaleFactorySendMode)}
                disabled={readOnly || saving}
              >
                <SelectTrigger className="ws-control" aria-label="Send the factory order">
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  {SEND_MODES.map(mode => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{SEND_MODES.find(m => m.value === draft.sendMode)?.description}</span>
            </div>

            <div className="grid grid-cols-[1fr_120px] items-end gap-3">
              <div className="grid gap-2 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.fulfillmentScreenEnabled ?? false}
                    onCheckedChange={checked => set('fulfillmentScreenEnabled', checked === true)}
                    disabled={readOnly || saving}
                  />
                  Uses the Factory Fulfillment Screen (kiosk)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.active ?? true}
                    onCheckedChange={checked => set('active', checked === true)}
                    disabled={readOnly || saving}
                  />
                  Active
                </label>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="factory-sort">Sort order</Label>
                <Input
                  id="factory-sort"
                  type="number"
                  className="ws-control ws-mono"
                  value={draft.sortOrder ?? ''}
                  onChange={e => set('sortOrder', e.target.value === '' ? null : Math.trunc(Number(e.target.value)))}
                />
              </div>
            </div>
          </fieldset>

          <div className="grid content-start gap-2">
            <div className="h-[300px] overflow-hidden rounded-md border">
              <Map
                id={MAP_ID}
                style={{ width: '100%', height: '100%' }}
                defaultCenter={hasPin ? { lat: draft.latitude, lng: draft.longitude } : DEFAULT_MAP_CENTER}
                defaultZoom={hasPin ? 13 : 7}
                gestureHandling="greedy"
                onClick={onMapClick}
              >
                {hasPin && <Marker position={{ lat: draft.latitude, lng: draft.longitude }} />}
              </Map>
              <PanTo lat={draft.latitude} lng={draft.longitude} />
            </div>
            <fieldset disabled={readOnly || saving} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <div className="grid gap-1">
                <Label htmlFor="factory-lat" className="text-xs">
                  Latitude
                </Label>
                <Input
                  id="factory-lat"
                  className="ws-control ws-mono"
                  value={draft.latitude ?? ''}
                  onChange={e => coordinate('latitude', e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="factory-lng" className="text-xs">
                  Longitude
                </Label>
                <Input
                  id="factory-lng"
                  className="ws-control ws-mono"
                  value={draft.longitude ?? ''}
                  onChange={e => coordinate('longitude', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="ws-control"
                disabled={!hasPin}
                onClick={() => setDraft(prev => ({ ...prev, latitude: null, longitude: null }))}
              >
                Clear pin
              </Button>
            </fieldset>
            <span className={shown.location ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {shown.location ?? (readOnly ? 'The pin customers are matched to.' : 'Click the map to move the pin and fill the address from Google Maps. Customers are matched to the nearest active factory.')}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button className="ws-control" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default FactoryEditor;
