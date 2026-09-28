import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Unlock } from 'lucide-react';
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
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsAlertDialogContent, WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { fetchDrivers } from '../route-definitions/route-definition.api';
import { IWholesaleDriver, driverName } from '../route-definitions/route-definition.model';
import { formatDay, toIsoDate } from '../closures/closure.model';
import { formatTime } from '../operations/operations.model';
import { ALL_FACTORIES, DayToolbar } from '../operations/day-toolbar';
import { changeDriver, fetchRun, fetchRuns, releaseRuns, unlockRun } from './delivery.api';
import { IRunDetail, IRunSummary, money, runState, stopName } from './delivery.model';
import { useDeliveryUpdates } from './delivery-socket';
import { StopDetailSheet } from './stop-detail-sheet';

const NO_DRIVER = '__none';
const ALL_ROUTES = '__all';

const { ADMIN, WHOLESALE_ADMIN, WHOLESALE_SALES_MANAGER, WHOLESALE_BOOKKEEPER } = AUTHORITIES;

/** Runs of a day per route: who drives, how far they are, and each stop as the driver recorded it. Updates live. */
const DeliveryRuns = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canManage = hasAnyAuthority(authorities, [ADMIN, WHOLESALE_ADMIN, WHOLESALE_SALES_MANAGER]);
  const canUnlock = hasAnyAuthority(authorities, [ADMIN, WHOLESALE_ADMIN, WHOLESALE_BOOKKEEPER]);

  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState(ALL_FACTORIES);
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [drivers, setDrivers] = useState<IWholesaleDriver[]>([]);
  const [runs, setRuns] = useState<IRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IRunDetail | null>(null);
  const [stopOrderId, setStopOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [release, setRelease] = useState<{ factoryId: string; routeId: string } | null>(null);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
    fetchDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]));
  }, []);

  const listRequest = useRef(0);
  const loadRuns = useCallback(async () => {
    const current = ++listRequest.current;
    try {
      const result = await fetchRuns(date, factoryId === ALL_FACTORIES ? null : factoryId);
      if (current !== listRequest.current) return;
      setRuns(result);
      setSelectedId(prev => (prev && result.some(r => r.id === prev) ? prev : (result[0]?.id ?? null)));
    } catch (error) {
      if (current !== listRequest.current) return;
      setRuns([]);
      toast.error(wholesaleErrorMessage(error, 'The delivery runs could not be loaded.'));
    } finally {
      if (current === listRequest.current) setLoading(false);
    }
  }, [date, factoryId]);

  const detailRequest = useRef(0);
  const loadDetail = useCallback(async () => {
    const current = ++detailRequest.current;
    if (!selectedId) {
      setDetail(null);
      return;
    }
    try {
      const result = await fetchRun(selectedId);
      if (current === detailRequest.current) setDetail(result);
    } catch (error) {
      if (current === detailRequest.current) toast.error(wholesaleErrorMessage(error, 'The run could not be loaded.'));
    }
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useDeliveryUpdates(event => {
    if (event?.deliveryDate && event.deliveryDate !== date) return;
    loadRuns();
    if (!event || event.runId === selectedId) loadDetail();
  });

  const factoryName = (id?: string | null) => factories.find(f => f.id === id)?.name ?? '';
  const routeName = (id?: string | null) => routes.find(r => r.id === id)?.name ?? 'Route';
  const driverLabel = (run: IRunSummary) => {
    if (!run.driverUserId) return null;
    return driverName(drivers.find(d => d.id === run.driverUserId)) || run.driverUsername || 'Driver';
  };

  const act = async (work: () => Promise<IRunDetail>, message: string, failure: string) => {
    setBusy(true);
    try {
      setDetail(await work());
      toast.success(message);
      loadRuns();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };

  const run = detail?.run;
  const state = run ? runState(run) : null;
  const unknownDriver = run?.driverUserId && !drivers.some(d => d.id === run.driverUserId);

  const releaseRoutes = useMemo(
    () => routes.filter(r => r.active !== false && (!release?.factoryId || r.factoryId === release.factoryId)),
    [routes, release?.factoryId],
  );

  const openRelease = () => setRelease({ factoryId: factoryId === ALL_FACTORIES ? (factories[0]?.id ?? '') : factoryId, routeId: ALL_ROUTES });

  const doRelease = async () => {
    const target = release;
    setBusy(true);
    try {
      const result = await releaseRuns(date, target.factoryId, target.routeId === ALL_ROUTES ? null : target.routeId);
      setRelease(null);
      const held = result.heldRouteDefinitionIds ?? [];
      if (result.ordersReleased === 0 && held.length === 0) {
        toast.info(`No orders waiting to be released for ${formatDay(date)}.`);
      } else {
        toast.success(`${result.ordersReleased} ${result.ordersReleased === 1 ? 'order' : 'orders'} released into ${result.runs.length} ${result.runs.length === 1 ? 'run' : 'runs'}`);
      }
      if (held.length > 0) {
        toast.warn(`Not released, because the run was already submitted: ${held.map(routeName).join(', ')}. Unlock the run first.`);
      }
      loadRuns();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The orders could not be released.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <WholesalePage
      title="Delivery Runs"
      context={`Deliveries on ${formatDay(date)}`}
      actions={
        canManage && (
          <Button className="ws-control" onClick={openRelease} disabled={factories.length === 0}>
            <Send className="mr-1 h-4 w-4" />
            Release now
          </Button>
        )
      }
    >
      <DayToolbar date={date} onDateChange={setDate} factories={factories} factoryId={factoryId} onFactoryChange={setFactoryId} allowAllFactories />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="ws-card overflow-hidden" data-testid="run-list">
          {runs.map(r => {
            const s = runState(r);
            const percent = r.stopsTotal > 0 ? Math.round((r.stopsDone / r.stopsTotal) * 100) : 0;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={cn('flex w-full flex-col gap-1.5 border-b px-4 py-3 text-left last:border-b-0', r.id === selectedId && 'bg-accent')}
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{r.name ?? routeName(r.routeDefinitionId)}</span>
                  <span className="flex-1" />
                  <WholesaleStatusBadge tone={s.tone}>{s.label}</WholesaleStatusBadge>
                </span>
                <span className="text-xs text-muted-foreground">
                  {[driverLabel(r) ?? 'No driver', factoryName(r.factoryId)].filter(Boolean).join(' / ')}
                </span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </span>
                  <span className="whitespace-nowrap text-muted-foreground">
                    {r.stopsDone} / {r.stopsTotal} stops
                  </span>
                </span>
              </button>
            );
          })}
          {runs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {loading ? 'Loading runs...' : `No runs for ${formatDay(date)}. Orders are released when the factory approves them, or with Release now.`}
            </div>
          )}
        </div>

        {run ? (
          <div className="grid content-start gap-4">
            <div className="ws-card grid gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 text-lg font-semibold">{run.name ?? routeName(run.routeDefinitionId)}</h2>
                <WholesaleStatusBadge tone={state.tone}>{state.label}</WholesaleStatusBadge>
                <div className="flex-1" />
                {run.locked && canUnlock && (
                  <Button variant="outline" className="ws-control" disabled={busy} onClick={() => setConfirmUnlock(true)}>
                    <Unlock className="mr-1 h-4 w-4" />
                    Unlock
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Driver</span>
                  {canManage && !run.locked ? (
                    <Select
                      value={run.driverUserId ?? NO_DRIVER}
                      onValueChange={value => {
                        const id = value === NO_DRIVER ? null : value;
                        const name = id ? driverName(drivers.find(d => d.id === id)) : null;
                        act(() => changeDriver(run.id, id), name ? `${name} drives this run` : 'Driver removed', 'The driver could not be changed.');
                      }}
                      disabled={busy}
                    >
                      <SelectTrigger className="ws-control w-60" aria-label="Driver">
                        <SelectValue />
                      </SelectTrigger>
                      <WsSelectContent>
                        <SelectItem value={NO_DRIVER}>No driver</SelectItem>
                        {drivers.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {driverName(d)}
                          </SelectItem>
                        ))}
                        {unknownDriver && <SelectItem value={run.driverUserId}>{run.driverUsername ?? 'Driver no longer active'}</SelectItem>}
                      </WsSelectContent>
                    </Select>
                  ) : (
                    <span className="font-medium">{driverLabel(run) ?? 'No driver'}</span>
                  )}
                </div>
                {run.factoryId && (
                  <span>
                    <span className="text-muted-foreground">Factory </span>
                    {factoryName(run.factoryId)}
                  </span>
                )}
                <span>
                  <span className="text-muted-foreground">Stops </span>
                  {run.stopsDone} / {run.stopsTotal} done
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {[
                  run.releasedAt && `Released ${formatTime(run.releasedAt)}`,
                  run.submittedAt && `Submitted ${formatTime(run.submittedAt)}${run.submittedBy ? ` by ${run.submittedBy}` : ''}`,
                  run.unlockedAt && `Unlocked ${formatTime(run.unlockedAt)}${run.unlockedBy ? ` by ${run.unlockedBy}` : ''}`,
                ]
                  .filter(Boolean)
                  .join(' / ')}
              </div>
              {run.locked && <div className="text-xs text-muted-foreground">The driver can no longer change this run until it is unlocked.</div>}
            </div>

            <div className="ws-card overflow-x-auto">
              <table className="ws-table" data-testid="run-stops">
                <thead>
                  <tr>
                    <th className="w-10">#</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Left to pay</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.stops.map((stop, index) => {
                    const done = stop.status != null && stop.status !== 'PENDING';
                    return (
                      <tr key={stop.orderId} className="cursor-pointer" onClick={() => setStopOrderId(stop.orderId)}>
                        <td className="font-semibold">{stop.sequence ?? index + 1}</td>
                        <td>
                          <div className="font-medium">{stopName(stop)}</div>
                          {stop.address && <div className="text-xs text-muted-foreground">{stop.address}</div>}
                        </td>
                        <td>
                          <WholesaleStatusBadge tone={done ? 'approved' : 'neutral'}>{done ? 'Delivered' : 'Pending'}</WholesaleStatusBadge>
                        </td>
                        <td className="text-right">{money(stop.total)}</td>
                        <td className="text-right">{money(stop.amountDue)}</td>
                      </tr>
                    );
                  })}
                  {detail.stops.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No stops on this run.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="ws-card px-4 py-8 text-center text-sm text-muted-foreground">{runs.length ? 'Choose a run.' : ''}</div>
        )}
      </div>

      <StopDetailSheet runId={stopOrderId ? (run?.id ?? null) : null} orderId={stopOrderId} onClose={() => setStopOrderId(null)} />

      <AlertDialog open={confirmUnlock} onOpenChange={setConfirmUnlock}>
        <WsAlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock {run?.name ?? 'this run'}?</AlertDialogTitle>
            <AlertDialogDescription>The driver can change its stops again and will need to submit the run again.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="ws-control">Cancel</AlertDialogCancel>
            <AlertDialogAction className="ws-control" onClick={() => act(() => unlockRun(run.id), 'Run unlocked', 'The run could not be unlocked.')}>
              Unlock
            </AlertDialogAction>
          </AlertDialogFooter>
        </WsAlertDialogContent>
      </AlertDialog>

      <Dialog open={release != null} onOpenChange={open => !open && !busy && setRelease(null)}>
        <WsDialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Release orders for {formatDay(date)}</DialogTitle>
            <DialogDescription>
              Puts the orders into their route&apos;s run without waiting for the factory&apos;s approval. Runs already submitted are left alone.
            </DialogDescription>
          </DialogHeader>
          {release && (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label>Factory</Label>
                <Select value={release.factoryId} onValueChange={value => setRelease({ factoryId: value, routeId: ALL_ROUTES })} disabled={busy}>
                  <SelectTrigger className="ws-control" aria-label="Release factory">
                    <SelectValue placeholder="Choose a factory" />
                  </SelectTrigger>
                  <WsSelectContent>
                    {factories.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </WsSelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Route</Label>
                <Select value={release.routeId} onValueChange={value => setRelease({ ...release, routeId: value })} disabled={busy}>
                  <SelectTrigger className="ws-control" aria-label="Release route">
                    <SelectValue />
                  </SelectTrigger>
                  <WsSelectContent>
                    <SelectItem value={ALL_ROUTES}>Every route of the factory</SelectItem>
                    {releaseRoutes.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </WsSelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="ws-control" onClick={() => setRelease(null)} disabled={busy}>
              Cancel
            </Button>
            <Button className="ws-control" onClick={doRelease} disabled={busy || !release?.factoryId}>
              {busy ? 'Releasing...' : 'Release'}
            </Button>
          </DialogFooter>
        </WsDialogContent>
      </Dialog>
    </WholesalePage>
  );
};

export default DeliveryRuns;
