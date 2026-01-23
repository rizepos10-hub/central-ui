import React from 'react';
import { logisticsOrders, LogisticsOrder } from './logistics.mock';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusVariants: Record<LogisticsOrder['status'], { text: string; className: string }> = {
  PENDING: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  IN_TRANSIT: { text: 'In transit', className: 'bg-sky-100 text-sky-800' },
  DELIVERED: { text: 'Delivered', className: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { text: 'Cancelled', className: 'bg-rose-100 text-rose-800' },
};

const totalOrders = logisticsOrders.length;
const inTransitOrders = logisticsOrders.filter(order => order.status === 'IN_TRANSIT').length;
const pendingOrders = logisticsOrders.filter(order => order.status === 'PENDING').length;

const WarehouseOrders = () => {
  return (
    <PageWrapper className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Orders</CardTitle>
          <CardDescription>Live view of mock warehouse shipments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total orders</p>
              <p className="text-2xl font-semibold text-slate-900">{totalOrders}</p>
            </div>
            <div className="rounded border border-slate-200 bg-emerald-50 p-4">
              <p className="text-sm text-slate-500">In transit</p>
              <p className="text-2xl font-semibold text-emerald-900">{inTransitOrders}</p>
            </div>
            <div className="rounded border border-slate-200 bg-amber-50 p-4">
              <p className="text-sm text-slate-500">Pending dispatch</p>
              <p className="text-2xl font-semibold text-amber-900">{pendingOrders}</p>
            </div>
          </div>
          <ScrollArea className="max-h-[520px] border border-slate-100 rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logisticsOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{order.reference}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.warehouse}</TableCell>
                    <TableCell>{order.destination}</TableCell>
                    <TableCell>
                      <Badge className={statusVariants[order.status].className}>
                        {statusVariants[order.status].text}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.eta}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {order.priority}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default WarehouseOrders;
