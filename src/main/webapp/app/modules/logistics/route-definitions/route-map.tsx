import React, { useEffect, useMemo } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

import { DEFAULT_MAP_CENTER, IWholesaleFactory } from '../factories/wholesale-factory.model';
import { DEFAULT_ROUTE_COLOR, IRouteMember, hasLocation, memberName } from './route-definition.model';

const MAP_ID = 'wholesale-route-map';

interface RouteMapProps {
  /** Stops in the order shown in the list; marker numbers follow this order. */
  stops: IRouteMember[];
  factory?: IWholesaleFactory | null;
  color?: string | null;
}

const RoutePath = ({ path, color }: { path: google.maps.LatLngLiteral[]; color: string }) => {
  const map = useMap(MAP_ID);
  useEffect(() => {
    if (!map || path.length < 2) return undefined;
    const line = new google.maps.Polyline({ path, strokeColor: color, strokeOpacity: 0.85, strokeWeight: 3, map });
    return () => line.setMap(null);
  }, [map, path, color]);
  return null;
};

const FitBounds = ({ points }: { points: google.maps.LatLngLiteral[] }) => {
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
    map.fitBounds(bounds, 40);
  }, [map, points]);
  return null;
};

export const RouteMap = ({ stops, factory, color }: RouteMapProps) => {
  const stroke = color || DEFAULT_ROUTE_COLOR;
  const origin = factory?.latitude != null && factory?.longitude != null ? { lat: factory.latitude, lng: factory.longitude } : null;

  const numbered = useMemo(
    () => stops.map((stop, index) => ({ stop, number: index + 1 })).filter(({ stop }) => hasLocation(stop)),
    [stops],
  );
  const path = useMemo(
    () => [...(origin ? [origin] : []), ...numbered.map(({ stop }) => ({ lat: stop.latitude, lng: stop.longitude }))],
    [origin?.lat, origin?.lng, numbered],
  );

  return (
    <div className="h-full min-h-[320px] overflow-hidden rounded-md border" data-testid="route-map">
      <Map id={MAP_ID} style={{ width: '100%', height: '100%' }} defaultCenter={DEFAULT_MAP_CENTER} defaultZoom={7} gestureHandling="greedy">
        {origin && <Marker position={origin} title={`${factory.name} (start)`} label={{ text: 'F', color: '#fff', fontWeight: '700' }} />}
        {numbered.map(({ stop, number }) => (
          <Marker
            key={stop.customerId}
            position={{ lat: stop.latitude, lng: stop.longitude }}
            title={`${number}. ${memberName(stop)}`}
            label={{ text: String(number), color: '#fff', fontSize: '12px', fontWeight: '600' }}
          />
        ))}
      </Map>
      <RoutePath path={path} color={stroke} />
      <FitBounds points={path} />
    </div>
  );
};

export default RouteMap;
