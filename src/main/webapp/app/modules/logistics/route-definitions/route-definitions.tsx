import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Plus, Route as RouteIcon, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsAlertDialogContent, WsDropdownMenuContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { IWholesaleCustomer, customerName, daysLabel } from '../customers/wholesale-customer.model';
import { AddStopDialog } from './add-stop-dialog';
import { RouteEditor } from './route-editor';
import { RouteMap } from './route-map';
import { RouteStops } from './route-stops';
import { addStop, deleteRoute, fetchDrivers, fetchRoutes, fetchStops, optimizeRoute, removeStop, saveStopOrder } from './route-definition.api';
import {
  DEFAULT_ROUTE_COLOR,
  IRouteDefinition,
  IRouteMember,
  IRouteOptimization,
  IWholesaleDriver,
  driverName,
  memberName,
  moveItem,
  newRoute,
  orderByIds,
  sameOrder,
} from './route-definition.model';

const ALL = '__all';

const WholesaleRouteDefinitions = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canManage = hasAnyAuthority(authorities, [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_SALES_MANAGER]);

  const [routes, setRoutes] = useState<IRouteDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [drivers, setDrivers] = useState<IWholesaleDriver[]>([]);
  const [factoryFilter, setFactoryFilter] = useState(ALL);
  const [activeOnly, setActiveOnly] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stops, setStops] = useState<IRouteMember[]>([]);
  const [order, setOrder] = useState<IRouteMember[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [proposal, setProposal] = useState<IRouteOptimization | null>(null);
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState<IRouteDefinition | null>(null);
  const [deleting, setDeleting] = useState<IRouteDefinition | null>(null);
  const [addingTo, setAddingTo] = useState<IRouteDefinition | null>(null);

  const selected = routes.find(r => r.id === selectedId) ?? null;
  const dirty = !sameOrder(order, stops);
  const factory = factories.find(f => f.id === selected?.factoryId) ?? null;

  useEffect(() => {
    fetchFactories()
      .then(setFactories)
      .catch(() => setFactories([]));
    fetchDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]));
    fetchRoutes()
      .then(list => {
        setRoutes(list);
        setSelectedId(prev => prev ?? list[0]?.id ?? null);
      })
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The routes could not be loaded.')))
      .finally(() => setLoading(false));
  }, []);

  const applyStops = (list: IRouteMember[]) => {
    setStops(list);
    setOrder(list);
    setProposal(null);
  };

  const loadStops = useCallback(async (routeId: string) => {
    setLoadingStops(true);
    try {
      applyStops(await fetchStops(routeId));
    } catch (error) {
      applyStops([]);
      toast.error(wholesaleErrorMessage(error, 'The stops could not be loaded.'));
    } finally {
      setLoadingStops(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadStops(selectedId);
    else applyStops([]);
  }, [selectedId, loadStops]);

  const shownRoutes = useMemo(
    () =>
      routes
        .filter(r => (factoryFilter === ALL || r.factoryId === factoryFilter) && (!activeOnly || r.active !== false))
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [routes, factoryFilter, activeOnly],
  );

  const select = (id: string) => {
    if (id === selectedId) return;
    if (dirty && !window.confirm('Discard the unsaved stop order?')) return;
    setSelectedId(id);
  };

  const factoryName = (id?: string | null) => factories.find(f => f.id === id)?.name ?? null;
  const driverLabel = (userId?: string | null) => (userId ? driverName(drivers.find(d => d.id === userId)) || 'driver no longer active' : null);

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };

  const saveOrder = () =>
    run(async () => {
      applyStops(await saveStopOrder(selected.id, order.map(s => s.customerId)));
      toast.success('Stop order saved');
    }, 'The stop order could not be saved.');

  const optimize = () =>
    run(async () => {
      const result = await optimizeRoute(selected.id);
      if (sameOrder(orderByIds(order, result.customerIds), order)) {
        toast.info('This order is already the shortest found.');
        return;
      }
      setProposal(result);
    }, 'The route could not be optimised.');

  const useProposal = () => {
    setOrder(orderByIds(order, proposal.customerIds));
    setProposal(null);
  };

  const onRemove = (member: IRouteMember) =>
    run(async () => {
      applyStops(await removeStop(selected.id, member.customerId));
      toast.success(`${memberName(member)} taken off ${selected.name}`);
    }, 'The stop could not be removed.');

  const onAdd = (customer: IWholesaleCustomer) =>
    run(async () => {
      applyStops(await addStop(addingTo.id, customer.id));
      toast.success(`${customerName(customer)} added to ${addingTo.name}`);
      setAddingTo(null);
    }, 'The stop could not be added.');

  const onSaved = (saved: IRouteDefinition) => {
    setRoutes(prev => (prev.some(r => r.id === saved.id) ? prev.map(r => (r.id === saved.id ? saved : r)) : [...prev, saved]));
    setEditing(null);
    if (!selectedId || editing?.id == null) setSelectedId(saved.id);
  };

  const confirmDelete = async () => {
    const target = deleting;
    setDeleting(null);
    try {
      await deleteRoute(target.id);
      setRoutes(prev => prev.filter(r => r.id !== target.id));
      if (selectedId === target.id) setSelectedId(null);
      toast.success(`${target.name} deleted`);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The route could not be deleted.'));
    }
  };

  const locatedCount = order.filter(s => s.latitude != null && s.longitude != null).length;

  return (
    <WholesalePage
      title="Route Setup"
      context={`${routes.filter(r => r.active !== false).length} active routes / stop order, factory, driver and delivery days`}
      actions={
        canManage && (
          <Button className="ws-control" onClick={() => setEditing(newRoute())}>
            <Plus className="mr-1 h-4 w-4" />
            New route
          </Button>
        )
      }
    >
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="grid content-start gap-2">
          <div className="flex items-center gap-2">
            <Select value={factoryFilter} onValueChange={setFactoryFilter}>
              <SelectTrigger className="ws-control flex-1" aria-label="Factory filter">
                <SelectValue />
              </SelectTrigger>
              <WsSelectContent>
                <SelectItem value={ALL}>All factories</SelectItem>
                {factories.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </WsSelectContent>
            </Select>
            <Button variant="outline" className="ws-control" aria-pressed={activeOnly} onClick={() => setActiveOnly(v => !v)}>
              {activeOnly ? 'Active' : 'All'}
            </Button>
          </div>
          <ul className="ws-card divide-y overflow-hidden" aria-label="Routes">
            {shownRoutes.map(r => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => select(r.id)}
                  aria-current={r.id === selectedId}
                  className={cn('grid w-full gap-0.5 px-3 py-2 text-left text-[13px] hover:bg-accent', r.id === selectedId && 'bg-accent')}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.color || DEFAULT_ROUTE_COLOR }} />
                    <span className="font-medium">{r.name}</span>
                    {r.code && <span className="ws-mono text-xs text-muted-foreground">{r.code}</span>}
                    {r.active === false && (
                      <WholesaleStatusBadge tone="neutral" className="ml-auto">
                        Inactive
                      </WholesaleStatusBadge>
                    )}
                  </span>
                  <span className="pl-[18px] text-xs text-muted-foreground">
                    {[factoryName(r.factoryId) ?? 'No factory', daysLabel(r.deliveryDays), driverLabel(r.defaultDriverUserId)].filter(Boolean).join(' / ')}
                  </span>
                </button>
              </li>
            ))}
            {!loading && shownRoutes.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">No routes.</li>}
            {loading && <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">Loading routes...</li>}
          </ul>
        </div>

        {selected ? (
          <div className="grid content-start gap-3">
            <div className="ws-card flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="h-3 w-3 rounded-full" style={{ background: selected.color || DEFAULT_ROUTE_COLOR }} />
              <div className="min-w-0">
                <div className="text-base font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">
                  Loads at {factoryName(selected.factoryId) ?? 'no factory'} / runs {daysLabel(selected.deliveryDays)} / driver{' '}
                  {driverLabel(selected.defaultDriverUserId) ?? 'not set'}
                </div>
              </div>
              {selected.notes && <div className="text-xs text-muted-foreground">{selected.notes}</div>}
              {canManage && (
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" className="ws-control" onClick={() => setEditing(selected)}>
                    Edit route
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`More for ${selected.name}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <WsDropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(selected)}>
                        Delete route
                      </DropdownMenuItem>
                    </WsDropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <div className="ws-card flex min-h-[320px] flex-col overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
                  <span className="text-sm font-semibold">
                    {order.length} stop{order.length === 1 ? '' : 's'}
                  </span>
                  {locatedCount < order.length && <span className="text-xs text-muted-foreground">{order.length - locatedCount} without a location</span>}
                  {canManage && (
                    <span className="ml-auto flex items-center gap-2">
                      {dirty ? (
                        <>
                          <Button variant="ghost" className="ws-control" disabled={busy} onClick={() => setOrder(stops)}>
                            Undo
                          </Button>
                          <Button className="ws-control" disabled={busy} onClick={saveOrder}>
                            Save order
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" className="ws-control" disabled={busy || order.length < 2} onClick={optimize}>
                            <Sparkles className="mr-1 h-4 w-4" />
                            Optimise
                          </Button>
                          <Button variant="outline" className="ws-control" disabled={busy} onClick={() => setAddingTo(selected)}>
                            <Plus className="mr-1 h-4 w-4" />
                            Add stop
                          </Button>
                        </>
                      )}
                    </span>
                  )}
                </div>
                {proposal && (
                  <div className="flex flex-wrap items-center gap-2 border-b bg-accent/50 px-3 py-2 text-[13px]" role="status">
                    <span>
                      Shorter order found
                      {proposal.currentKm != null && proposal.proposedKm != null && (
                        <>
                          : <span className="ws-mono">{proposal.proposedKm.toFixed(1)} km</span> instead of{' '}
                          <span className="ws-mono">{proposal.currentKm.toFixed(1)} km</span>
                        </>
                      )}
                      {!proposal.originFactoryId && ' (starting from the first stop; the factory has no pin)'}
                      {proposal.unlocatedCustomerIds.length > 0 && `. ${proposal.unlocatedCustomerIds.length} stops without a location stay at the end`}.
                    </span>
                    <span className="ml-auto flex gap-2">
                      <Button variant="ghost" className="ws-control" onClick={() => setProposal(null)}>
                        Discard
                      </Button>
                      <Button className="ws-control" onClick={useProposal}>
                        Use this order
                      </Button>
                    </span>
                  </div>
                )}
                <div className="flex-1 overflow-auto">
                  {loadingStops ? (
                    <div className="py-8 text-center text-[13px] text-muted-foreground">Loading stops...</div>
                  ) : (
                    <RouteStops
                      stops={order}
                      readOnly={!canManage || busy}
                      canRemove={!dirty}
                      onMove={(from, to) => setOrder(prev => moveItem(prev, from, to))}
                      onRemove={onRemove}
                    />
                  )}
                </div>
                {dirty && <div className="border-t px-3 py-1.5 text-xs text-[hsl(var(--ws-amendment))]">The new order is not saved yet.</div>}
              </div>

              <RouteMap stops={order} factory={factory} color={selected.color} />
            </div>
          </div>
        ) : (
          <div className="ws-card flex min-h-[320px] flex-col items-center justify-center gap-2 text-[13px] text-muted-foreground">
            <RouteIcon className="h-6 w-6" />
            {routes.length === 0 && !loading ? 'No routes yet.' : 'Choose a route.'}
          </div>
        )}
      </div>

      <RouteEditor route={editing} factories={factories} drivers={drivers} onClose={() => setEditing(null)} onSaved={onSaved} />

      <AddStopDialog route={addingTo} routes={routes} onClose={() => setAddingTo(null)} onPick={onAdd} />

      <AlertDialog open={deleting != null} onOpenChange={open => !open && setDeleting(null)}>
        <WsAlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>A route with customers on it can&apos;t be deleted; move them or deactivate the route instead.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="ws-control">Cancel</AlertDialogCancel>
            <AlertDialogAction className="ws-control bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </WsAlertDialogContent>
      </AlertDialog>
    </WholesalePage>
  );
};

export default WholesaleRouteDefinitions;
