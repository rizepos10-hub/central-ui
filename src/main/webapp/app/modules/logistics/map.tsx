import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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

const LogisticsMap = () => {
  const dispatch = useAppDispatch();
  const routes = useAppSelector(state => state.logistics.entities);
  const loading = useAppSelector(state => state.logistics.loading);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithPath | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchRoutes({ page: 0, size: 1000, sort: 'routeDate,desc' }));
  }, [dispatch]);

  const handleRouteSelect = useCallback((route: RouteWithPath) => {
    setSelectedRoute(route);
    setDialogOpen(true);
  }, []);

  const handleRouteToggle = useCallback((routeId: string) => {
    setSelectedRouteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeId)) {
        newSet.delete(routeId);
      } else {
        newSet.add(routeId);
      }
      return newSet;
    });
  }, []);

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

  const handleSelectAll = useCallback(() => {
    if (selectedRouteIds.size === routesWithPath.length) {
      setSelectedRouteIds(new Set());
    } else {
      const allIds = routesWithPath.map(r => r.id).filter(Boolean) as string[];
      setSelectedRouteIds(new Set(allIds));
    }
  }, [selectedRouteIds.size, routesWithPath]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRoute(null);
  };

  // Get selected routes for iframe display
  const selectedRoutes = useMemo(() => {
    return routesWithPath.filter(route => route.id && selectedRouteIds.has(route.id));
  }, [routesWithPath, selectedRouteIds]);

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Route Maps</CardTitle>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedRouteIds.size === routesWithPath.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedRouteIds.size} of {routesWithPath.length} selected
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route selection list */}
          <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
            <div className="space-x-2 flex flex-row gap-2">
              {routesWithPath.map(route => {
                const isSelected = route.id && selectedRouteIds.has(route.id);
                const embedUrl = convertToEmbedUrl(route.navigationUrl);
                return (
                  <div
                    key={route.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => route.id && handleRouteToggle(route.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => route.id && handleRouteToggle(route.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{route.name || 'Unnamed Route'}</span>
                        <Badge className="ml-2 text-xs" variant="outline">
                          {route.status || 'PLANNED'}
                        </Badge>
                      </div>
                      {!embedUrl && (
                        <span className="text-xs text-muted-foreground">No navigation URL</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Iframe maps for selected routes */}
          {selectedRoutes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRoutes.map(route => {
                const embedUrl = convertToEmbedUrl(route.navigationUrl);
                if (!embedUrl) return null;
                
                return (
                  <Card key={route.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{route.name || 'Route'}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {route.status || 'PLANNED'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      <iframe
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        src={embedUrl}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              Select routes above to view their maps
            </div>
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
