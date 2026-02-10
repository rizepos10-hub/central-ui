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

// Convert navigation URL to embeddable iframe URL
const convertToEmbedUrl = (navigationUrl?: string): string | null => {
  if (!navigationUrl) return null;
  try {
    const url = new URL(navigationUrl);
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');
    const waypoints = url.searchParams.get('waypoints');
    
    if (!origin || !destination) return null;
    
    // Build embed URL - Google Maps Embed API format
    const embedUrl = new URL('https://www.google.com/maps/embed/v1/directions');
    embedUrl.searchParams.set('key', typeof GOOGLE_MAPS_API_KEY !== 'undefined' ? GOOGLE_MAPS_API_KEY : '');
    embedUrl.searchParams.set('origin', origin);
    embedUrl.searchParams.set('destination', destination);
    if (waypoints) {
      embedUrl.searchParams.set('waypoints', waypoints);
    }
    
    return embedUrl.toString();
  } catch (error) {
    return null;
  }
};

// Combine all routes into one iframe URL with all waypoints
const combineAllRoutesToEmbedUrl = (routes: RouteWithPath[]): string | null => {
  if (routes.length === 0) return null;
  
  try {
    // Collect all origins, destinations, and waypoints from all routes
    const allWaypoints: string[] = [];
    let firstOrigin: string | null = null;
    let lastDestination: string | null = null;
    
    routes.forEach(route => {
      if (!route.navigationUrl) return;
      
      try {
        const url = new URL(route.navigationUrl);
        const origin = url.searchParams.get('origin');
        const destination = url.searchParams.get('destination');
        const waypoints = url.searchParams.get('waypoints');
        
        if (origin && !firstOrigin) {
          firstOrigin = origin;
        }
        
        if (destination) {
          lastDestination = destination;
        }
        
        if (waypoints) {
          // Split waypoints and add them
          const wpArray = waypoints.split('|').filter(Boolean);
          allWaypoints.push(...wpArray);
        }
        
        // Add origin and destination as waypoints for routes in between
        if (origin && firstOrigin && origin !== firstOrigin) {
          allWaypoints.push(origin);
        }
        if (destination && lastDestination && destination !== lastDestination) {
          allWaypoints.push(destination);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    if (!firstOrigin || !lastDestination) return null;
    
    // Build embed URL with all waypoints
    const embedUrl = new URL('https://www.google.com/maps/embed/v1/directions');
    embedUrl.searchParams.set('key', typeof GOOGLE_MAPS_API_KEY !== 'undefined' ? GOOGLE_MAPS_API_KEY : '');
    embedUrl.searchParams.set('origin', firstOrigin);
    embedUrl.searchParams.set('destination', lastDestination);
    
    // Combine all waypoints (limit to 25 for API)
    if (allWaypoints.length > 0) {
      const limitedWaypoints = allWaypoints.slice(0, 25).join('|');
      embedUrl.searchParams.set('waypoints', limitedWaypoints);
    }
    
    return embedUrl.toString();
  } catch (error) {
    return null;
  }
};

const LogisticsMap = () => {
  const dispatch = useAppDispatch();
  const routes = useAppSelector(state => state.logistics.entities);
  const loading = useAppSelector(state => state.logistics.loading);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithPath | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'iframe'>('iframe');

  useEffect(() => {
    dispatch(fetchRoutes({ page: 0, size: 1000, sort: 'routeDate,desc' }));
  }, [dispatch]);

  const handleRouteSelect = useCallback((route: RouteWithPath) => {
    setSelectedRoute(route);
    setDialogOpen(true);
    // If in iframe mode, switch to show the selected route
    if (viewMode === 'iframe') {
      // The embedUrl will update automatically via useMemo
    }
  }, [viewMode]);

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

  // Use selected route for iframe, or combine all routes if none selected
  const embedUrl = useMemo(() => {
    if (selectedRoute) {
      // Show selected route
      return convertToEmbedUrl(selectedRoute.navigationUrl);
    } else if (routesWithPath.length > 0) {
      // Combine all routes into one iframe
      return combineAllRoutesToEmbedUrl(routesWithPath);
    }
    return null;
  }, [selectedRoute, routesWithPath]);

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Route Map</CardTitle>
          <div className="flex gap-2 items-center">
            {viewMode === 'iframe' && (
              <span className="text-sm text-muted-foreground mr-2">
                {selectedRoute 
                  ? `Showing: ${selectedRoute.name || 'Route'}` 
                  : `Showing: All ${routesWithPath.length} routes combined`}
              </span>
            )}
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              Custom Map ({routesWithPath.length})
            </Button>
            <Button
              variant={viewMode === 'iframe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('iframe')}
              disabled={!embedUrl}
            >
              Google Maps
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[560px] p-0">
          {viewMode === 'iframe' && embedUrl ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={embedUrl}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
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
          )}
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
