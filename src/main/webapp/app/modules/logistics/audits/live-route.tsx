import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { toast } from 'react-toastify';

import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { DEFAULT_MAP_CENTER, IWholesaleFactory } from '../factories/wholesale-factory.model';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { fetchDrivers } from '../route-definitions/route-definition.api';
import { DEFAULT_ROUTE_COLOR, IWholesaleDriver, driverName } from '../route-definitions/route-definition.model';
import { formatDay, toIsoDate } from '../closures/closure.model';
import { formatTime } from '../operations/operations.model';
import { ALL_FACTORIES, DayToolbar } from '../operations/day-toolbar';
import { runState, stopName } from '../delivery/delivery.model';
import { useDeliveryUpdates } from '../delivery/delivery-socket';
import { fetchLiveRoute, fetchTrail } from './audits.api';
import { ILiveDay, ILiveRouteEvent, ILiveRun, IPosition, ageLabel, hasPosition } from './audits.model';
import { useLiveRouteUpdates } from './audits-socket';

const MAP_ID = 'wholesale-live-route-map';

const toLatLng = (p: IPosition & { latitude: number; longitude: number }) => ({ lat: p.latitude, lng: p.longitude });

/** Applies a pushed position to the day without a refetch; runs of another day or unknown runs are left alone. */
export const applyPosition = (day: ILiveDay | null, event: ILiveRouteEvent): ILiveDay | null => {
  if (!day || !event.runId || !hasPosition(event.position) || (event.deliveryDate && event.deliveryDate !== day.date)) return day;
  if (!day.runs.some(r => r.run.id === event.runId)) return day;
  return { ...day, runs: day.runs.map(r => (r.run.id === event.runId ? { ...r, lastPosition: event.position, ageSeconds: 0, stale: false } : r)) };
};

const Trail = ({ points, color }: { points: google.maps.LatLngLiteral[]; color: string }) => {
  const map = useMap(MAP_ID);
  useEffect(() => {
    if (!map || points.length < 2) return undefined;
    const line = new google.maps.Polyline({ path: points, strokeColor: color, strokeOpacity: 0.8, strokeWeight: 4, map });
    return () => line.setMap(null);
  }, [map, points, color]);
  return null;
};

const FitBounds = ({ points, fitKey }: { points: google.maps.LatLngLiteral[]; fitKey: string }) => {
  const map = useMap(MAP_ID);
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.setCenter(points[0]);
      map.setZoom(13);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, 48);
  }, [map, fitKey]);
  return null;
};

/** Where each driver is now, how far along the route they are, and the path driven so far. */
const LiveRoute = () => {
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState(ALL_FACTORIES);
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [drivers, setDrivers] = useState<IWholesaleDriver[]>([]);
  const [day, setDay] = useState<ILiveDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trail, setTrail] = useState<IPosition[]>([]);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
    fetchDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]));
  }, []);

  const dayRequest = useRef(0);
  const loadDay = useCallback(async () => {
    const current = ++dayRequest.current;
    try {
      const result = await fetchLiveRoute(date, factoryId === ALL_FACTORIES ? null : factoryId);
      if (current !== dayRequest.current) return;
      setDay(result);
      setSelectedId(prev => (prev && result.runs.some(r => r.run.id === prev) ? prev : null));
    } catch (error) {
      if (current !== dayRequest.current) return;
      setDay(null);
      toast.error(wholesaleErrorMessage(error, 'The live route could not be loaded.'));
    } finally {
      if (current === dayRequest.current) setLoading(false);
    }
  }, [date, factoryId]);

  const trailRequest = useRef(0);
  const loadTrail = useCallback(async () => {
    const current = ++trailRequest.current;
    if (!selectedId) {
      setTrail([]);
      return;
    }
    try {
      const result = await fetchTrail(selectedId);
      if (current === trailRequest.current) setTrail(result.points);
    } catch (error) {
      if (current === trailRequest.current) toast.error(wholesaleErrorMessage(error, 'The route driven could not be loaded.'));
    }
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    loadDay();
  }, [loadDay]);

  useEffect(() => {
    loadTrail();
  }, [loadTrail]);

  useLiveRouteUpdates(event => {
    if (!event) {
      loadDay();
      return;
    }
    setDay(prev => applyPosition(prev, event));
    if (event.runId === selectedId && hasPosition(event.position)) setTrail(prev => [...prev, event.position]);
  }, (day?.intervalSeconds ?? 60) * 1000);

  useDeliveryUpdates(event => {
    if (!event?.deliveryDate || event.deliveryDate === date) loadDay();
  });

  const routeColor = (run: ILiveRun) => routes.find(r => r.id === run.run.routeDefinitionId)?.color || DEFAULT_ROUTE_COLOR;
  const driverLabel = (run: ILiveRun) =>
    run.run.driverUserId ? driverName(drivers.find(d => d.id === run.run.driverUserId)) || run.run.driverUsername || 'Driver' : 'No driver';

  const runs = day?.runs ?? [];
  const selected = runs.find(r => r.run.id === selectedId) ?? null;
  const trailPath = useMemo(() => trail.filter(hasPosition).map(toLatLng), [trail]);
  const reporting = runs.filter(r => hasPosition(r.lastPosition));
  const stops = (selected?.stops ?? []).filter(s => s.latitude != null && s.longitude != null);

  const fitPoints = useMemo(() => {
    if (selected) {
      return [
        ...(hasPosition(selected.lastPosition) ? [toLatLng(selected.lastPosition)] : []),
        ...stops.map(s => ({ lat: s.latitude, lng: s.longitude })),
        ...trailPath,
      ];
    }
    return reporting.map(r => toLatLng(r.lastPosition as IPosition & { latitude: number; longitude: number }));
  }, [selected, stops.length, trailPath.length, reporting.length]);
  const fitKey = `${selectedId ?? 'all'}-${date}-${factoryId}-${fitPoints.length > 0}`;

  const stale = runs.filter(r => r.stale).length;

  return (
    <WholesalePage title="Live Route" context={`Drivers on ${formatDay(date)}${stale > 0 ? `, ${stale} not reporting` : ''}`}>
      <DayToolbar date={date} onDateChange={setDate} factories={factories} factoryId={factoryId} onFactoryChange={setFactoryId} allowAllFactories />

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="ws-card grid content-start divide-y overflow-y-auto lg:max-h-[640px]" data-testid="live-runs">
          {runs.map(r => {
            const state = runState(r.run);
            return (
              <button
                key={r.run.id}
                type="button"
                className={cn('grid gap-1 px-4 py-3 text-left hover:bg-accent', r.run.id === selectedId && 'bg-accent')}
                onClick={() => setSelectedId(prev => (prev === r.run.id ? null : r.run.id))}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: routeColor(r) }} />
                  <span className="font-medium">{r.run.name ?? 'Run'}</span>
                  <span className="flex-1" />
                  <WholesaleStatusBadge tone={state.tone}>{state.label}</WholesaleStatusBadge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{driverLabel(r)}</span>
                  <span className="text-muted-foreground">
                    {r.run.stopsDone} / {r.run.stopsTotal} stops
                  </span>
                </div>
                <div className={cn('text-xs', r.stale ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                  {r.stale ? 'Not reporting: ' : ''}
                  {ageLabel(r.ageSeconds)}
                  {r.lastPosition?.recordedAt ? ` (${formatTime(r.lastPosition.recordedAt)})` : ''}
                </div>
              </button>
            );
          })}
          {runs.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">{loading ? 'Loading...' : `No runs for ${formatDay(date)}.`}</div>}
        </div>

        <div className="h-[640px] overflow-hidden rounded-md border" data-testid="live-map">
          <Map id={MAP_ID} style={{ width: '100%', height: '100%' }} defaultCenter={DEFAULT_MAP_CENTER} defaultZoom={8} gestureHandling="greedy">
            {reporting.map(r => (
              <Marker
                key={r.run.id}
                position={toLatLng(r.lastPosition as IPosition & { latitude: number; longitude: number })}
                title={`${r.run.name ?? 'Run'}: ${driverLabel(r)}, ${ageLabel(r.ageSeconds)}`}
                label={{ text: (r.run.name ?? 'R').slice(0, 2).toUpperCase(), color: '#fff', fontWeight: '700', fontSize: '11px' }}
                opacity={r.stale ? 0.5 : 1}
                zIndex={r.run.id === selectedId ? 1000 : undefined}
                onClick={() => setSelectedId(r.run.id)}
              />
            ))}
            {stops.map((s, index) => (
              <Marker
                key={s.orderId}
                position={{ lat: s.latitude, lng: s.longitude }}
                title={`${s.sequence ?? index + 1}. ${stopName(s)}${s.status && s.status !== 'PENDING' ? ' (done)' : ''}`}
                label={{ text: String(s.sequence ?? index + 1), color: s.status && s.status !== 'PENDING' ? '#bbf7d0' : '#fff', fontSize: '11px', fontWeight: '600' }}
                opacity={s.status && s.status !== 'PENDING' ? 0.55 : 0.9}
              />
            ))}
          </Map>
          {selected && <Trail points={trailPath} color={routeColor(selected)} />}
          <FitBounds points={fitPoints} fitKey={fitKey} />
        </div>
      </div>
    </WholesalePage>
  );
};

export default LiveRoute;
