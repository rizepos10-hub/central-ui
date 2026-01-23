import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import {
  logisticsOrders,
  logisticsRoutes,
  LogisticsRoute,
} from './logistics.mock';

const MapRoutesOverlay = ({ onRouteClick }: { onRouteClick: (route: LogisticsRoute) => void }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const overlays = logisticsRoutes.map(route => {
      const polyline = new google.maps.Polyline({
        path: route.path,
        strokeColor: route.color,
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
  }, [map, onRouteClick]);

  return null;
};

const LogisticsMap = () => {
  const [selectedRoute, setSelectedRoute] = useState<LogisticsRoute | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const routeOrders = useMemo(
    () => (selectedRoute ? logisticsOrders.filter(order => order.routeId === selectedRoute.id) : []),
    [selectedRoute]
  );

  const handleRouteSelect = useCallback((route: LogisticsRoute) => {
    setSelectedRoute(route);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedRoute(null);
  };

  const defaultCenter = useMemo(() => ({ lat: 42.315, lng: -83.036 }), []);

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
        </CardHeader>
        <CardContent className="h-[560px] p-0">
          <Map
            id="logistics-map"
            defaultCenter={defaultCenter}
            defaultZoom={11.2}
            style={{ width: '100%', height: '100%' }}
            mapTypeControl={false}
            fullscreenControl={false}
            streetViewControl={false}
          >
            <MapRoutesOverlay onRouteClick={handleRouteSelect} />
            {logisticsRoutes.map(route => (
              <Marker
                key={route.id}
                position={route.path[0]}
                label={{ text: route.truck, fontWeight: '600' }}
              />
            ))}
          </Map>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRoute ? `${selectedRoute.name} — ${selectedRoute.truck}` : 'Route orders'}
            </DialogTitle>
            <DialogDescription>
              Clicked route orders are grouped here for quick review.
            </DialogDescription>
          </DialogHeader>

          {selectedRoute && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <Badge className="bg-slate-100 text-slate-800">{selectedRoute.status}</Badge>
                <div className="text-sm text-slate-500">
                  Estimated arrival {selectedRoute.estimatedTime}
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routeOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No mock orders assigned yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {routeOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>{order.reference}</TableCell>
                      <TableCell>{order.destination}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.status}</TableCell>
                      <TableCell>{order.eta}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
