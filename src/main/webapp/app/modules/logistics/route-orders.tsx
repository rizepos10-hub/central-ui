import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { getEntities as getBranches } from 'app/entities/branch/branch.reducer';
import { filterAssignedOrders } from 'app/entities/order/order.reducer';
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
import { Select as UiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Copy, ExternalLink } from 'lucide-react';

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
  // const [orderBranchId, setOrderBranchId] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'customer' | 'address' | 'status' | 'plannedArrival'>('customer');
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDeliveryAddress, setFilterDeliveryAddress] = useState('');
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

  const getCustomerName = (stop: IWholesaleRouteStop) => {
    if (!stop.order?.customer) return '—';
    const customer = stop.order.customer;
    if (customer.businessDetails?.businessName) {
      return customer.businessDetails.businessName;
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '—';
  };

  const getDeliveryAddress = (stop: IWholesaleRouteStop) => {
    if (!stop.order?.deliverTo) return '—';
    const address = stop.order.deliverTo;
    return address.address || `${address.street || ''} ${address.city || ''}`.trim() || '—';
  };

  // Filter stops based on filters
  const filteredStops = useMemo(() => {
    return stops.filter(stop => {
      // Filter by customer name
      if (filterCustomerName) {
        const customerName = getCustomerName(stop).toLowerCase();
        if (!customerName.includes(filterCustomerName.toLowerCase())) {
          return false;
        }
      }

      // Filter by status
      if (filterStatus && stop.status !== filterStatus) {
        return false;
      }

      // Filter by delivery address
      if (filterDeliveryAddress) {
        const address = getDeliveryAddress(stop).toLowerCase();
        if (!address.includes(filterDeliveryAddress.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [stops, filterCustomerName, filterStatus, filterDeliveryAddress]);

  // Group stops by customer, address, status, or planned arrival
  const groupedStops = useMemo(() => {
    if (groupBy === 'none') {
      return { ungrouped: filteredStops };
    }

    const groups: Record<string, IWholesaleRouteStop[]> = {};
    
    filteredStops.forEach(stop => {
      let key: string;
      if (groupBy === 'customer') {
        key = stop.order?.customer?.id || 'no-customer';
      } else if (groupBy === 'address') {
        // Use address ID or a combination of address fields as key
        const address = stop.order?.deliverTo;
        if (address?.id) {
          key = address.id;
        } else if (address?.latitude && address?.longitude) {
          key = `${address.latitude}_${address.longitude}`;
        } else if (address?.address) {
          // Use address string as fallback key
          key = address.address;
        } else {
          key = 'no-address';
        }
      } else if (groupBy === 'status') {
        key = stop.status || 'no-status';
      } else if (groupBy === 'plannedArrival') {
        if (stop.plannedArrivalTime) {
          const date = new Date(stop.plannedArrivalTime);
          key = date.toISOString().split('T')[0]; // Group by date
        } else {
          key = 'no-date';
        }
      } else {
        key = 'ungrouped';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(stop);
    });

    return groups;
  }, [filteredStops, groupBy]);

  const handleAddStop = () => {
    const newIndex = stops.length;
    setStops(prev => [
      ...prev,
      {
        sequenceNumber: prev.length + 1,
        orderId: '',
        plannedArrivalTime: null,
        actualArrivalTime: null,
        status: 'PENDING',
        notes: '',
      },
    ]);
    // Automatically open the order dialog for the newly added stop
    setActiveStopIndex(newIndex);
    setIsOrderModalOpen(true);
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
        // selected branch or warehouseBranchId
      ...(selectedBranchId || route?.warehouseBranchId ? { branchId: selectedBranchId || route?.warehouseBranchId } : {}),
      // ...(orderBranchId ? { branchId: orderBranchId } : {}),
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
    dispatch(filterAssignedOrders(buildOrdersQuery()));
  }, [dispatch, isOrderModalOpen, orderLazyState, orderSearch, selectedBranchId, route?.warehouseBranchId]);

  const handleSelectOrder = (order: IOrder) => {
    if (activeStopIndex === null) return;
    setStops(prev =>
      prev.map((stop, idx) => 
        idx === activeStopIndex 
          ? { ...stop, orderId: order.id, order: order }
          : stop
      )
    );
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
                  <UiSelect value={status || route?.status || ''} onValueChange={(value) => setStatus(value as WholesaleRouteStatus)}>
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
                  </UiSelect>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Warehouse Branch</Label>
                  <UiSelect
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
                  </UiSelect>
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
                  <div className="flex items-center gap-1">
                    <Input
                      value={route?.navigationUrl || ''}
                      readOnly
                      placeholder="No navigation URL available"
                      className="flex-1 p-2"
                    />
                    {route?.navigationUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-2"
                          onClick={() => {
                            navigator.clipboard.writeText(route.navigationUrl);
                          }}
                          title="Copy URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-2"
                          onClick={() => {
                            window.open(route.navigationUrl, '_blank', 'noopener,noreferrer');
                          }}
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Stops</h3>
                  <div className="flex items-center gap-2">
                    <UiSelect value={groupBy} onValueChange={(value) => setGroupBy(value as 'none' | 'customer' | 'address' | 'status' | 'plannedArrival')}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Group by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No grouping</SelectItem>
                        <SelectItem value="customer">Group by Customer</SelectItem>
                        <SelectItem value="address">Group by Address</SelectItem>
                        <SelectItem value="status">Group by Status</SelectItem>
                        <SelectItem value="plannedArrival">Group by Planned Arrival</SelectItem>
                      </SelectContent>
                    </UiSelect>
                    <Button variant="outline" size="sm" onClick={handleAddStop}>
                      Add Stop
                    </Button>
                  </div>
                </div>
                {/* Filters row */}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-xs whitespace-nowrap">Customer:</Label>
                    <Input
                      placeholder="Search customer..."
                      value={filterCustomerName}
                      onChange={(e) => setFilterCustomerName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-xs whitespace-nowrap">Address:</Label>
                    <Input
                      placeholder="Search address..."
                      value={filterDeliveryAddress}
                      onChange={(e) => setFilterDeliveryAddress(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Status:</Label>
                    <UiSelect value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-8 text-xs w-[140px]">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>All</SelectItem>
                        {Object.values(WholesaleRouteStopStatus).map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </UiSelect>
                  </div>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Seq</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Delivery Address</TableHead>
                        <TableHead>Planned Arrival</TableHead>
                        <TableHead>Actual Arrival</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!filteredStops.length && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                            {stops.length === 0 ? 'No stops available.' : 'No stops match the current filters.'}
                          </TableCell>
                        </TableRow>
                      )}
                      {Object.entries(groupedStops).map(([groupKey, groupStops]) => {
                        const isGrouped = groupBy !== 'none';
                        let groupLabel: string | null = null;
                        
                        if (isGrouped && groupStops.length > 0) {
                          if (groupBy === 'customer') {
                            groupLabel = getCustomerName(groupStops[0]);
                          } else if (groupBy === 'address') {
                            groupLabel = getDeliveryAddress(groupStops[0]);
                          } else if (groupBy === 'status') {
                            groupLabel = groupStops[0].status || 'No Status';
                          } else if (groupBy === 'plannedArrival') {
                            if (groupStops[0].plannedArrivalTime) {
                              const date = new Date(groupStops[0].plannedArrivalTime);
                              groupLabel = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            } else {
                              groupLabel = 'No Planned Arrival';
                            }
                          }
                        }

                        return (
                          <React.Fragment key={groupKey}>
                            {isGrouped && groupLabel && (
                              <TableRow className="bg-muted/50">
                                <TableCell colSpan={8} className="font-semibold text-sm py-2">
                                  {groupBy === 'customer' && 'Customer: '}
                                  {groupBy === 'address' && 'Address: '}
                                  {groupBy === 'status' && 'Status: '}
                                  {groupBy === 'plannedArrival' && 'Planned Arrival: '}
                                  {groupLabel} ({groupStops.length} {groupStops.length === 1 ? 'stop' : 'stops'})
                                </TableCell>
                              </TableRow>
                            )}
                            {groupStops.map((stop, groupIndex) => {
                              const originalIndex = stops.findIndex(s => s === stop);
                              if (originalIndex === -1) return null;
                              return (
                                <TableRow key={`${stop.orderId || 'stop'}-${originalIndex}`}>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      className="h-8 text-xs"
                                      value={stop.sequenceNumber ?? ''}
                                      onChange={(e) => handleStopChange(originalIndex, 'sequenceNumber', parseInt(e.target.value, 10) || 0)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {!stop.orderId && (
                                        <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-1 text-sm text-yellow-800">
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                          <span>No order selected</span>
                                        </div>
                                      )}
                                      {stop.orderId && (
                                        <>
                                          <span className="text-xs">{getCustomerName(stop)}</span>
                                          <Button variant="outline" className="text-xs" size="sm" onClick={() => openOrderModal(originalIndex)}>
                                            Change
                                          </Button>
                                        </>
                                      )}
                                      {!stop.orderId && (
                                        <Button variant="outline" className="text-xs" size="sm" onClick={() => openOrderModal(originalIndex)}>
                                          Select
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs">{getDeliveryAddress(stop)}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="datetime-local"
                                      className="h-8 text-xs"
                                      value={stop.plannedArrivalTime ? new Date(stop.plannedArrivalTime).toISOString().slice(0, 16) : ''}
                                      onChange={(e) => handleStopChange(originalIndex, 'plannedArrivalTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="datetime-local"
                                      className="h-8 text-xs"
                                      value={stop.actualArrivalTime ? new Date(stop.actualArrivalTime).toISOString().slice(0, 16) : ''}
                                      onChange={(e) => handleStopChange(originalIndex, 'actualArrivalTime', e.target.value ? new Date(e.target.value).toISOString() : null)}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <UiSelect
                                      value={stop.status || ''}
                                      onValueChange={(value) => handleStopChange(originalIndex, 'status', value)}
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
                                    </UiSelect>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      className="h-8 text-xs"
                                      value={stop.notes || ''}
                                      onChange={(e) => handleStopChange(originalIndex, 'notes', e.target.value)}
                                      placeholder="Notes"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveStop(originalIndex)}>
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
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
              {/* <UiSelect value={orderBranchId} onValueChange={setOrderBranchId}>
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
              </UiSelect> */}
              <Button
                variant="outline"
                onClick={() => {
                  setOrderLazyState(prev => ({ ...prev, page: 0, first: 0 }));
                  dispatch(filterAssignedOrders(buildOrdersQuery()));
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
                   orders.filter(order => !stops.some(stop => stop.orderId === order.id)).map(order => (
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
