import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { runtimeConfig } from 'app/config/runtime-config';
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
import Select from 'react-select';
import { fetchRoutes } from './logistics.reducer';
import { IWholesaleRoute, WholesaleRouteStatus } from './logistics.model';
import { format } from 'date-fns';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { EyeIcon } from 'lucide-react';

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
    embedUrl.searchParams.set('key', runtimeConfig.GOOGLE_MAPS_API_KEY || '');
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
  const navigate = useNavigate();
  const routes = useAppSelector(state => state.logistics.entities);
  const loading = useAppSelector(state => state.logistics.loading);
  const branches = useAppSelector(state => state.branch.entities);
  const [selectedRoute, setSelectedRoute] = useState<RouteWithPath | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchRoutes({ page: 0, size: 1000, sort: 'routeDate,desc' }));
    dispatch(getBranches({}));
  }, [dispatch]);

  const getBranchName = (branchId?: string) => {
    return branches.find(branch => branch.id === branchId)?.name || '—';
  };

  const routesWithPath = useMemo(
    () =>
      routes
        .map(route => ({
          ...route,
          path: buildPathFromNavigationUrl(route.navigationUrl),
        }))
        .filter(route => {
          // Filter out completed and cancelled routes
          if (route.status === WholesaleRouteStatus.COMPLETED || route.status === WholesaleRouteStatus.CANCELLED) {
            return false;
          }
          // Only include routes with valid paths
          return route.path.length > 1;
        }),
    [routes]
  );

  // Set first route as selected by default
  useEffect(() => {
    if (routesWithPath.length > 0 && !selectedRoute) {
      setSelectedRoute(routesWithPath[0]);
    }
  }, [routesWithPath, selectedRoute]);

  // Create options for react-select
  const routeOptions = useMemo(() => {
    return routesWithPath.map(route => ({
      value: route.id,
      label: route.name || 'Unnamed Route',
      route: route,
    }));
  }, [routesWithPath]);

  const handleRouteSelect = useCallback((option: { value: string; label: string; route: RouteWithPath } | null) => {
    if (option?.route) {
      setSelectedRoute(option.route);
    }
  }, []);

  const handleNavigateToRoute = useCallback(() => {
    if (selectedRoute?.id) {
      navigate(`/logistics/routes/${selectedRoute.id}`);
    }
  }, [selectedRoute, navigate]);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRoute(null);
  };

  // Get embed URL for selected route
  const selectedRouteEmbedUrl = useMemo(() => {
    return selectedRoute ? convertToEmbedUrl(selectedRoute.navigationUrl) : null;
  }, [selectedRoute]);

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Route selection dropdown and details */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 min-w-[200px] max-w-[300px]">
              <Select
                options={routeOptions}
                value={routeOptions.find(opt => opt.value === selectedRoute?.id) || null}
                onChange={(option) => handleRouteSelect(option as { value: string; label: string; route: RouteWithPath } | null)}
                placeholder="Select a route"
                isClearable={false}
                className="text-sm"
              />
            </div>
            
            {/* Route details */}
            {selectedRoute && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge variant="outline">
                  {selectedRoute.status || 'PLANNED'}
                </Badge>
                {selectedRoute.routeDate && (
                  <span className="text-muted-foreground">
                    {format(new Date(selectedRoute.routeDate), 'MMM dd, yyyy')}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {selectedRoute.stops?.length || 0} stops
                </span>
                {selectedRoute.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNavigateToRoute}
                  >
                    <EyeIcon className="w-4 h-4" />
                    View
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Single iframe map for selected route */}
          {selectedRouteEmbedUrl ? (
            <div className="h-[500px] rounded-lg overflow-hidden border">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src={selectedRouteEmbedUrl}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[500px] text-muted-foreground border rounded-lg">
              {selectedRoute ? 'No navigation URL available for this route' : 'Select a route above to view its map'}
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
