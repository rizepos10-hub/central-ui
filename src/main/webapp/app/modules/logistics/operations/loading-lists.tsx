import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { formatDay } from '../closures/closure.model';
import { fetchLoadingLists } from './operations.api';
import { ILoadingList, SHEET_STATUS_LABEL, formatQty, sheetTone, tomorrow } from './operations.model';
import { ALL_FACTORIES, DayToolbar } from './day-toolbar';

const ALL_ROUTES = '__all';

/** Per route, the stops in delivery order with what to load for each customer, produced and purchased. One route per printed page. */
const LoadingLists = () => {
  const [date, setDate] = useState(() => tomorrow());
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState(ALL_FACTORIES);
  const [routeId, setRouteId] = useState(ALL_ROUTES);
  const [lists, setLists] = useState<ILoadingList[]>([]);
  const [routes, setRoutes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    try {
      const result = await fetchLoadingLists(date, factoryId === ALL_FACTORIES ? null : factoryId);
      if (current !== request.current) return;
      setLists(result);
      setRoutes(result.map(l => ({ id: l.routeId, name: l.routeName ?? l.routeId })));
    } catch (error) {
      if (current !== request.current) return;
      setLists([]);
      setRoutes([]);
      toast.error(wholesaleErrorMessage(error, 'The loading lists could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [date, factoryId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (routeId !== ALL_ROUTES && !routes.some(r => r.id === routeId)) setRouteId(ALL_ROUTES);
  }, [routes]);

  const shown = routeId === ALL_ROUTES ? lists : lists.filter(l => l.routeId === routeId);

  return (
    <WholesalePage
      title="Loading Lists"
      context={`Deliveries on ${formatDay(date)}`}
      actions={
        <Button variant="outline" className="ws-control print:hidden" onClick={() => window.print()} disabled={shown.length === 0}>
          <Printer className="mr-1 h-4 w-4" />
          Print
        </Button>
      }
    >
      <DayToolbar date={date} onDateChange={setDate} factories={factories} factoryId={factoryId} onFactoryChange={setFactoryId} allowAllFactories>
        <Select value={routeId} onValueChange={setRouteId}>
          <SelectTrigger className="ws-control w-52" aria-label="Route">
            <SelectValue />
          </SelectTrigger>
          <WsSelectContent>
            <SelectItem value={ALL_ROUTES}>All routes</SelectItem>
            {routes.map(r => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </WsSelectContent>
        </Select>
      </DayToolbar>

      {shown.map(list => (
        <section key={list.routeId} className="ws-card overflow-hidden break-after-page" data-testid={`loading-${list.routeId}`}>
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <h2 className="m-0 text-base font-semibold">
              {list.routeName}
              {list.routeCode && <span className="ml-2 font-normal text-muted-foreground">{list.routeCode}</span>}
            </h2>
            <span className="text-sm text-muted-foreground">
              {formatDay(list.date)}, {list.stops.length} {list.stops.length === 1 ? 'stop' : 'stops'}
            </span>
            <div className="flex-1" />
            <WholesaleStatusBadge tone={sheetTone(list.sheetStatus)}>{SHEET_STATUS_LABEL[list.sheetStatus ?? 'NOT_SUBMITTED']}</WholesaleStatusBadge>
          </div>
          <table className="ws-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Customer</th>
                <th>Product</th>
                <th className="text-right">Quantity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {list.stops.map((stop, index) =>
                stop.lines.map((line, lineIndex) => (
                  <tr key={`${stop.customerId}-${line.key}`} className={lineIndex === 0 && index > 0 ? 'border-t-2' : undefined}>
                    {lineIndex === 0 && (
                      <>
                        <td rowSpan={stop.lines.length} className="align-top font-semibold">
                          {index + 1}
                        </td>
                        <td rowSpan={stop.lines.length} className="align-top">
                          <div className="font-medium">{stop.customerName}</div>
                          {stop.address && <div className="text-xs text-muted-foreground">{stop.address}</div>}
                          {stop.phone && <div className="text-xs text-muted-foreground">{stop.phone}</div>}
                        </td>
                      </>
                    )}
                    <td>
                      {line.name}
                      {line.sourcing === 'PURCHASED' && <span className="ml-1.5 text-xs text-muted-foreground">(purchased)</span>}
                    </td>
                    <td className="text-right font-semibold">{formatQty(line.quantity)}</td>
                    <td className="text-muted-foreground">{line.notes}</td>
                  </tr>
                )),
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="text-sm">
                  <span className="font-semibold">Load: </span>
                  {list.totals.map(t => `${t.name} ${formatQty(t.total)}`).join(', ')}
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      ))}

      {shown.length === 0 && (
        <div className="ws-card py-8 text-center text-sm text-muted-foreground">
          {loading ? 'Loading lists...' : `Nothing to load for ${formatDay(date)}.`}
        </div>
      )}
    </WholesalePage>
  );
};

export default LoadingLists;
