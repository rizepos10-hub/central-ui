import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logisticsOrders, logisticsRoutes } from './logistics.mock';
import { PageWrapper } from 'app/shared/layout/page-wrapper';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RouteOrders = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();

  const route = logisticsRoutes.find(r => r.id === routeId);
  const orders = logisticsOrders.filter(order => order.routeId === routeId);

  if (!route) {
    return (
      <PageWrapper>
        <Card>
          <CardHeader>
            <CardTitle>Route not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Select a route from the routes page.</p>
            <div className="mt-4">
              <Button variant="ghost" onClick={() => navigate('/logistics/routes')}>
                Back to routes
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{route.name}</CardTitle>
          <CardDescription>
            Driver {route.driver} — Truck {route.truck} — {route.distance}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-slate-100 text-slate-800">{route.status}</Badge>
            </div>
            <Button variant="outline" onClick={() => navigate('/logistics/routes')}>
              Back to routes
            </Button>
          </div>
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>{order.reference}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.warehouse}</TableCell>
                  <TableCell>{order.destination}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.eta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default RouteOrders;
