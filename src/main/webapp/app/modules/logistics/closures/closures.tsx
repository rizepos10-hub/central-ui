import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
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
import { fetchRouteDefinitions, fetchWholesaleCustomer } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition, customerName } from '../customers/wholesale-customer.model';
import { ClosureEditor } from './closure-editor';
import { ClosuresCalendar } from './closures-calendar';
import { deleteClosure, fetchAllRouteDeliveryDays, fetchClosures } from './closure.api';
import { IDeliveryDay, IWholesaleClosure, buildRouteMarks, formatDay, formatRange, monthGrid, newClosure, scopeLabel, toIsoDate } from './closure.model';

const ALL = '__all';

type View = 'calendar' | 'list';

interface RouteDays {
  route: IWholesaleRouteDefinition;
  days: IDeliveryDay[];
}

const WholesaleClosures = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canManage = hasAnyAuthority(authorities, [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_SALES_MANAGER]);

  const today = toIsoDate(new Date());
  const [cursor, setCursor] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const [view, setView] = useState<View>('calendar');
  const [routeFilter, setRouteFilter] = useState(ALL);

  const [closures, setClosures] = useState<IWholesaleClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [routeDays, setRouteDays] = useState<RouteDays[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  const [editing, setEditing] = useState<IWholesaleClosure | null>(null);
  const [deleting, setDeleting] = useState<IWholesaleClosure | null>(null);

  const days = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);
  const from = days[0];
  const to = days[days.length - 1];

  useEffect(() => {
    fetchFactories()
      .then(setFactories)
      .catch(() => setFactories([]));
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  const activeRoutes = useMemo(() => routes.filter(r => r.active !== false), [routes]);

  const closuresRequest = useRef(0);
  const load = useCallback(async () => {
    const request = ++closuresRequest.current;
    setLoading(true);
    try {
      const list = await fetchClosures(from, to);
      if (request === closuresRequest.current) setClosures(list);
    } catch (error) {
      if (request !== closuresRequest.current) return;
      setClosures([]);
      toast.error(wholesaleErrorMessage(error, 'The closures could not be loaded.'));
    } finally {
      if (request === closuresRequest.current) setLoading(false);
    }
  }, [from, to]);

  const routeDaysRequest = useRef(0);
  const loadRouteDays = useCallback(async () => {
    const request = ++routeDaysRequest.current;
    if (activeRoutes.length === 0) {
      setRouteDays([]);
      return;
    }
    const byRoute = await fetchAllRouteDeliveryDays(from, to).catch((): Record<string, IDeliveryDay[]> => ({}));
    if (request === routeDaysRequest.current) setRouteDays(activeRoutes.map(route => ({ route, days: byRoute[route.id] ?? [] })));
  }, [activeRoutes, from, to]);

  useEffect(() => {
    setClosures([]);
    load();
  }, [load]);

  useEffect(() => {
    setRouteDays([]);
    loadRouteDays();
  }, [loadRouteDays]);

  useEffect(() => {
    const missing = Array.from(new Set(closures.filter(c => c.scope === 'CUSTOMER' && c.scopeId && !customerNames[c.scopeId]).map(c => c.scopeId)));
    missing.forEach(id =>
      fetchWholesaleCustomer(id)
        .then(customer => setCustomerNames(prev => ({ ...prev, [id]: customerName(customer) })))
        .catch(() => undefined),
    );
  }, [closures]);

  const routeMarks = useMemo(
    () => buildRouteMarks(routeFilter === ALL ? routeDays : routeDays.filter(({ route }) => route.id === routeFilter)),
    [routeDays, routeFilter],
  );

  const target = (c: IWholesaleClosure) => {
    switch (c.scope) {
      case 'FACTORY':
        return factories.find(f => f.id === c.scopeId)?.name ?? 'Factory';
      case 'ROUTE':
        return routes.find(r => r.id === c.scopeId)?.name ?? 'Route';
      case 'CUSTOMER':
        return customerNames[c.scopeId] ?? 'Customer';
      default:
        return 'Everyone';
    }
  };
  const closureLabel = (c: IWholesaleClosure) => (c.reason ? `${c.reason} (${target(c)})` : `Closed (${target(c)})`);

  const affectedRoutes = (c: IWholesaleClosure) =>
    routeDays.filter(({ days: list }) => list.some(d => d.closureIds?.includes(c.id))).map(({ route }) => route.name);

  const sorted = useMemo(() => [...closures].sort((a, b) => (a.fromDate ?? '').localeCompare(b.fromDate ?? '')), [closures]);

  const move = (delta: number) =>
    setCursor(({ year, month }) => {
      const date = new Date(year, month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  const onSaved = (saved: IWholesaleClosure, label?: string) => {
    if (saved.scope === 'CUSTOMER' && saved.scopeId && label) setCustomerNames(prev => ({ ...prev, [saved.scopeId]: label }));
    setEditing(null);
    load();
    loadRouteDays();
  };

  const confirmDelete = async () => {
    const closure = deleting;
    setDeleting(null);
    try {
      await deleteClosure(closure.id);
      toast.success('Closure deleted');
      load();
      loadRouteDays();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The closure could not be deleted.'));
    }
  };

  const monthName = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstOfMonth = toIsoDate(new Date(cursor.year, cursor.month, 1));

  return (
    <WholesalePage
      title="Closures"
      context="Holidays and other days with no deliveries, and what happens to the deliveries that fall on them"
      actions={
        canManage && (
          <Button className="ws-control" onClick={() => setEditing(newClosure(today >= firstOfMonth && today <= to ? today : firstOfMonth))}>
            <Plus className="mr-1 h-4 w-4" />
            New closure
          </Button>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" className="ws-control w-8" aria-label="Previous month" onClick={() => move(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="ws-control w-8" aria-label="Next month" onClick={() => move(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="min-w-[140px] text-sm font-semibold" data-testid="month-name">
          {monthName}
        </span>
        <Button variant="ghost" className="ws-control" onClick={() => setCursor({ year: new Date().getFullYear(), month: new Date().getMonth() })}>
          Today
        </Button>
        <div className="inline-flex overflow-hidden rounded-full border bg-card" role="group" aria-label="View">
          {(['calendar', 'list'] as const).map(v => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px] capitalize', view === v && 'bg-accent font-semibold text-accent-foreground')}
            >
              {v}
            </button>
          ))}
        </div>
        <Select value={routeFilter} onValueChange={setRouteFilter}>
          <SelectTrigger className="ws-control ml-auto w-52" aria-label="Show route days">
            <SelectValue />
          </SelectTrigger>
          <WsSelectContent>
            <SelectItem value={ALL}>All active routes</SelectItem>
            {routes
              .filter(r => r.active !== false)
              .map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
          </WsSelectContent>
        </Select>
      </div>

      {view === 'calendar' ? (
        <ClosuresCalendar
          days={days}
          month={cursor.month}
          today={today}
          closures={closures}
          routeMarks={routeMarks}
          closureLabel={closureLabel}
          onDayClick={canManage ? day => setEditing(newClosure(day)) : undefined}
          onClosureClick={setEditing}
        />
      ) : (
        <div className="ws-card overflow-hidden">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Applies to</th>
                <th>Deliveries</th>
                <th>Reason</th>
                <th>Affected routes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map(c => {
                const affected = affectedRoutes(c);
                return (
                  <tr key={c.id} className="cursor-pointer" onClick={() => setEditing(c)}>
                    <td className="whitespace-nowrap">{formatRange(c.fromDate, c.toDate)}</td>
                    <td>
                      <span className="text-muted-foreground">{scopeLabel(c.scope)}</span>
                      {c.scope !== 'BUSINESS' && <span className="ml-1.5 font-medium">{target(c)}</span>}
                    </td>
                    <td>
                      {c.action === 'MOVE' ? (
                        <WholesaleStatusBadge tone="amendment">Moved to {formatDay(c.moveToDate)}</WholesaleStatusBadge>
                      ) : (
                        <WholesaleStatusBadge tone="cancelled">Skipped</WholesaleStatusBadge>
                      )}
                    </td>
                    <td>{c.reason || '-'}</td>
                    <td className="max-w-[260px] truncate text-muted-foreground">{affected.length ? affected.join(', ') : 'None'}</td>
                    <td className="w-8" onClick={e => e.stopPropagation()}>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${closureLabel(c)}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <WsDropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditing(c)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(c)}>
                              Delete
                            </DropdownMenuItem>
                          </WsDropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No closures in {monthName}.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading closures...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {canManage ? (
        <ClosureEditor
          closure={editing}
          factories={factories}
          routes={routes}
          customerNames={customerNames}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      ) : (
        editing && (
          <AlertDialog open onOpenChange={open => !open && setEditing(null)}>
            <WsAlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{closureLabel(editing)}</AlertDialogTitle>
                <AlertDialogDescription>
                  {formatRange(editing.fromDate, editing.toDate)} / {scopeLabel(editing.scope)} /{' '}
                  {editing.action === 'MOVE' ? `deliveries move to ${formatDay(editing.moveToDate)}` : 'deliveries are skipped'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="ws-control">Close</AlertDialogCancel>
              </AlertDialogFooter>
            </WsAlertDialogContent>
          </AlertDialog>
        )
      )}

      <AlertDialog open={deleting != null} onOpenChange={open => !open && setDeleting(null)}>
        <WsAlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this closure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && `${closureLabel(deleting)}, ${formatRange(deleting.fromDate, deleting.toDate)}. Deliveries on these days go back to normal.`}
            </AlertDialogDescription>
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

export default WholesaleClosures;
