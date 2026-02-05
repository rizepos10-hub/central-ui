import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { filterOrders } from 'app/entities/order/order.reducer';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { PageWrapper } from 'app/shared/layout/page-wrapper';

import { createRoute, deleteRoute, fetchRoute, updateRoute } from './logistics.reducer';
import { IWholesaleRoute, IWholesaleRouteStop, WholesaleRouteStatus, WholesaleRouteStopStatus } from './logistics.model';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RouteOrders = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isCreateMode = routeId === 'new';
  const route = useAppSelector(state => state.logistics.entity) as IWholesaleRoute;
  const loading = useAppSelector(state => state.logistics.loading);
  const updating = useAppSelector(state => state.logistics.updating);
  const branches = useAppSelector(state => state.branch.entities);
  const orders = useAppSelector(state => state.order.entities);
  const ordersLoading = useAppSelector(state => state.order.loading);
  const totalOrders = useAppSelector(state => state.order.totalOrders || 0);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<WholesaleRouteStatus | ''>('');
  const [routeDate, setRouteDate] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [stops, setStops] = useState<IWholesaleRouteStop[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderBranchId, setOrderBranchId] = useState('');
  const [orderLazyState, setOrderLazyState] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'createdDate',
    sortOrder: -1,
  });

  useEffect(() => {
    dispatch(getBranches({}));
  }, [dispatch]);

  useEffect(() => {
    if (routeId && !isCreateMode) {
      dispatch(fetchRoute(routeId));
    }
  }, [dispatch, routeId, isCreateMode]);

  useEffect(() => {
    if (isCreateMode) {
      setName('');
      setStatus(WholesaleRouteStatus.PLANNED);
      setRouteDate(new Date().toISOString().slice(0, 16));
      setSelectedBranchId('');
      setStops([]);
      return;
    }

    if (route?.id) {
      setName(route.name || '');
      setStatus(route.status || '');
      setRouteDate(route.routeDate ? new Date(route.routeDate).toISOString().slice(0, 16) : '');
      setSelectedBranchId(route.warehouseBranchId || '');
      setStops(route.stops || []);
    }
  }, [route, isCreateMode]);

  const handleSave = async () => {
    const nextRouteDate = routeDate ? new Date(routeDate).toISOString() : route.routeDate;
    const payload: IWholesaleRoute = {
      ...(isCreateMode ? {} : route),
      name,
      status: status || route.status,
      routeDate: nextRouteDate,
      warehouseBranchId: selectedBranchId || route.warehouseBranchId,
      stops,
    };
    if (isCreateMode) {
      const response = await dispatch(createRoute(payload)).unwrap();
      const createdId = response?.data?.id;
      if (createdId) {
        navigate(`/logistics/routes/${createdId}`);
      }
    } else {
      await dispatch(updateRoute({ ...payload, id: route.id }));
      dispatch(fetchRoute(route.id));
    }
  };

  const handleDelete = async () => {
    if (!route?.id) return;
    await dispatch(deleteRoute(route.id));
    navigate('/logistics/routes');
  };

  const getBranchDisplay = (branchId?: string) =>
    branches.find(branch => branch.id === branchId)?.name || '—';

  const handleAddStop = () => {
    setStops(prev => [
      ...prev,
      {
        sequenceNumber: prev.length + 1,
        orderId: '',
        plannedArrivalTime: '',
        actualArrivalTime: null,
        status: 'PENDING',
        notes: '',
      },
    ]);
  };

  const handleRemoveStop = (index: number) => {
    setStops(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleStopChange = (index: number, key: keyof IWholesaleRouteStop, value: any) => {
    setStops(prev =>
      prev.map((stop, idx) => (idx === index ? { ...stop, [key]: value } : stop))
    );
  };

  const openOrderModal = (index: number) => {
    setActiveStopIndex(index);
    setIsOrderModalOpen(true);
  };

  const buildOrdersQuery = () => {
    const trimmed = orderSearch.trim();
    const isNumeric = trimmed !== '' && /^\d+$/.test(trimmed);
    return {
      wholesale: true,
      page: orderLazyState.page,
      size: orderLazyState.rows,
      sort: orderLazyState.sortField
        ? `${orderLazyState.sortField},${orderLazyState.sortOrder === 1 ? 'asc' : 'desc'}`
        : '_id,desc',
      ...(orderBranchId ? { branchId: orderBranchId } : {}),
      ...(trimmed
        ? {
            sequenceId: isNumeric ? trimmed : '',
            id: isNumeric ? '' : trimmed,
          }
        : {}),
    };
  };

  useEffect(() => {
    if (!isOrderModalOpen) return;
    dispatch(filterOrders(buildOrdersQuery()));
  }, [dispatch, isOrderModalOpen, orderLazyState, orderSearch, orderBranchId]);

  const handleSelectOrder = (order: IOrder) => {
    if (activeStopIndex === null) return;
    handleStopChange(activeStopIndex, 'orderId', order.id);
    setIsOrderModalOpen(false);
  };

  if (!routeId) {
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
          <CardTitle>{isCreateMode ? 'Create Route' : 'Route Details'}</CardTitle>
          <CardDescription>Update route information and view stops.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading route...</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-800">{status || route?.status || '—'}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Branch: {getBranchDisplay(selectedBranchId || route?.warehouseBranchId)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => navigate('/logistics/routes')}>
                    Back to routes
                  </Button>
                  {!isCreateMode && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={updating}>
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Route</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {route?.name || 'this route'}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Route Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Route name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select value={status || route?.status || ''} onValueChange={(value) => setStatus(value as WholesaleRouteStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WholesaleRouteStatus).map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Warehouse Branch</Label>
                  <Select
                    value={selectedBranchId || route?.warehouseBranchId || ''}
                    onValueChange={(value) => setSelectedBranchId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Route Date</Label>
                  <Input
                    type="datetime-local"
                    value={routeDate}
                    onChange={e => setRouteDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Navigation URL (auto)</Label>
                  {route?.navigationUrl ? (
                    <a className="text-sm text-primary hover:underline" href={route.navigationUrl} target="_blank" rel="noreferrer">
                      Open navigation link
                    </a>
                  ) : (
                    <div className="text-sm text-muted-foreground">—</div>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs">Salesmen</Label>
                  <div className="text-sm text-muted-foreground">
                    {route?.salesmanIds?.length ? route.salesmanIds.join(', ') : '—'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Stops</h3>
                  <Button variant="outline" size="sm" onClick={handleAddStop}>
                    Add Stop
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Seq</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Planned Arrival</TableHead>
                        <TableHead>Actual Arrival</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!stops.length && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                            No stops available.
                          </TableCell>
                        </TableRow>
                      )}
                      {stops.map((stop, index) => (
                        <TableRow key={`${stop.orderId || 'stop'}-${index}`}>
                          <TableCell>
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={stop.sequenceNumber ?? ''}
                              onChange={(e) => handleStopChange(index, 'sequenceNumber', parseInt(e.target.value, 10) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{stop.orderId || '—'}</span>
                              <Button variant="outline" size="sm" onClick={() => openOrderModal(index)}>
                                Select
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="datetime-local"
                              className="h-8 text-xs"
                              value={stop.plannedArrivalTime ? new Date(stop.plannedArrivalTime).toISOString().slice(0, 16) : ''}
                              onChange={(e) => handleStopChange(index, 'plannedArrivalTime', e.target.value ? new Date(e.target.value).toISOString() : '')}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="datetime-local"
                              className="h-8 text-xs"
                              value={stop.actualArrivalTime ? new Date(stop.actualArrivalTime).toISOString().slice(0, 16) : ''}
                              onChange={(e) => handleStopChange(index, 'actualArrivalTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={stop.status || ''}
                              onValueChange={(value) => handleStopChange(index, 'status', value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(WholesaleRouteStopStatus).map(option => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 text-xs"
                              value={stop.notes || ''}
                              onChange={(e) => handleStopChange(index, 'notes', e.target.value)}
                              placeholder="Notes"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveStop(index)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updating}>
                  {isCreateMode ? 'Create route' : 'Save changes'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Wholesale Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by order ID or sequence number"
              />
              <Select value={orderBranchId} onValueChange={setOrderBranchId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setOrderLazyState(prev => ({ ...prev, page: 0, first: 0 }));
                  dispatch(filterOrders(buildOrdersQuery()));
                }}
              >
                Search
              </Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Sequence</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                        Loading orders...
                      </TableCell>
                    </TableRow>
                  )}
                  {!ordersLoading && orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                        No wholesale orders found.
                      </TableCell>
                    </TableRow>
                  )}
                  {!ordersLoading &&
                    orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell>{order.sequenceNumber ?? '—'}</TableCell>
                        <TableCell className="text-xs">{order.id}</TableCell>
                        <TableCell>
                          {order.customer
                            ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || '—'
                            : '—'}
                        </TableCell>
                        <TableCell>{getBranchDisplay(order.branchId || undefined)}</TableCell>
                        <TableCell>{order.orderProcessingStatus || order.processingStatus || order.status || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleSelectOrder(order)}>
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {orderLazyState.first + 1}-{Math.min(orderLazyState.first + orderLazyState.rows, totalOrders)} of {totalOrders}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={orderLazyState.first === 0}
                  onClick={() =>
                    setOrderLazyState(prev => ({
                      ...prev,
                      first: Math.max(0, prev.first - prev.rows),
                      page: Math.max(0, prev.page - 1),
                    }))
                  }
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={orderLazyState.first + orderLazyState.rows >= totalOrders}
                  onClick={() =>
                    setOrderLazyState(prev => ({
                      ...prev,
                      first: prev.first + prev.rows,
                      page: prev.page + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default RouteOrders;
