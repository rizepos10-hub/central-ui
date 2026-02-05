import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import { fetchRoutes } from './logistics.reducer';
import { IWholesaleRoute, WholesaleRouteStatus } from './logistics.model';

type RouteWithPath = IWholesaleRoute & { path: google.maps.LatLngLiteral[] };

const parseLatLng = (value?: string) => {
  if (!value) return null;
  const [latStr, lngStr] = value.split(',');
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

const buildPathFromNavigationUrl = (navigationUrl?: string) => {
  if (!navigationUrl) return [];
  try {
    const url = new URL(navigationUrl);
    const origin = parseLatLng(url.searchParams.get('origin') || undefined);
    const destination = parseLatLng(url.searchParams.get('destination') || undefined);
    const waypointsParam = url.searchParams.get('waypoints') || '';
    const waypoints = waypointsParam
      .split('|')
      .map(point => parseLatLng(point))
      .filter(Boolean) as google.maps.LatLngLiteral[];

    const path = [];
    if (origin) path.push(origin);
    path.push(...waypoints);
    if (destination) path.push(destination);
    return path;
  } catch (error) {
    return [];
  }
};

const getRouteColor = (status?: WholesaleRouteStatus) => {
  switch (status) {
    case WholesaleRouteStatus.IN_PROGRESS:
      return '#3b82f6';
    case WholesaleRouteStatus.COMPLETED:
      return '#16a34a';
    case WholesaleRouteStatus.CANCELLED:
      return '#dc2626';
    case WholesaleRouteStatus.PLANNED:
    default:
      return '#64748b';
  }
};

const MapRoutesOverlay = ({
  routes,
  onRouteClick,
}: {
  routes: RouteWithPath[];
  onRouteClick: (route: RouteWithPath) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const overlays = routes.map(route => {
      const polyline = new google.maps.Polyline({
        path: route.path,
        strokeColor: getRouteColor(route.status),
        strokeOpacity: 0.85,
        strokeWeight: 5,
        clickable: true,
        map,
        zIndex: 3,
      });

      const listener = polyline.addListener('click', () => onRouteClick(route));

      return {
        polyline,
        listener,
      };
    });

    return () => {
      overlays.forEach(({ polyline, listener }) => {
        google.maps.event.removeListener(listener);
        polyline.setMap(null);
      });
    };
  }, [map, onRouteClick, routes]);

  return null;
};

const LogisticsMap = () => {
  const dispatch = useAppDispatch();
  const routes = useAppSelector(state => state.logistics.entities);
  const loading = useAppSelector(state => state.logistics.loading);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithPath | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchRoutes({ page: 0, size: 1000, sort: 'routeDate,desc' }));
  }, [dispatch]);

  const handleRouteSelect = useCallback((route: RouteWithPath) => {
    setSelectedRoute(route);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRoute(null);
  };

  const routesWithPath = useMemo(
    () =>
      routes
        .map(route => ({
          ...route,
          path: buildPathFromNavigationUrl(route.navigationUrl),
        }))
        .filter(route => route.path.length > 1),
    [routes]
  );

  const defaultCenter = useMemo(() => ({ lat: 42.315, lng: -83.036 }), []);
  const mapCenter = useMemo(() => routesWithPath[0]?.path?.[0] || defaultCenter, [routesWithPath, defaultCenter]);

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
        </CardHeader>
        <CardContent className="h-[560px] p-0">
          <Map
            id="logistics-map"
            defaultCenter={mapCenter}
            defaultZoom={11.2}
            style={{ width: '100%', height: '100%' }}
            mapTypeControl={false}
            fullscreenControl={false}
            streetViewControl={false}
          >
            <MapRoutesOverlay routes={routesWithPath} onRouteClick={handleRouteSelect} />
            {routesWithPath.map(route => (
              <Marker
                key={route.id}
                position={route.path[0]}
                label={{ text: route.name || '', fontWeight: '600' }}
              />
            ))}
          </Map>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRoute ? `${selectedRoute.name}` : 'Route'}
            </DialogTitle>
            <DialogDescription>
              Clicked route details are shown here for quick review.
            </DialogDescription>
          </DialogHeader>

          {selectedRoute && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <Badge className="bg-slate-100 text-slate-800">{selectedRoute.status || '—'}</Badge>
                {selectedRoute.navigationUrl && (
                  <a
                    className="text-sm text-primary hover:underline"
                    href={selectedRoute.navigationUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open navigation
                  </a>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Route has {selectedRoute.stops?.length || 0} stops.
              </div>
            </>
          )}

          <DialogFooter className="mt-6">
            <Button variant="secondary" onClick={handleDialogClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default LogisticsMap;
