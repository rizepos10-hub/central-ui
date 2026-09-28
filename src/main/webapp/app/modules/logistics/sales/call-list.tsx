import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { CustomerNoteDialog } from './customer-note-dialog';
import { LogCallDialog } from './log-call-dialog';
import { fetchCallList } from './sales.api';
import { ICallListEntry, addDays, formatDay, outcomeLabel, todayIso } from './sales.model';

const ALL = '__all';

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

const CallList = () => {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(searchParams.get('date') || addDays(todayIso(), 1));
  const [routeId, setRouteId] = useState(ALL);
  const [includeDone, setIncludeDone] = useState(false);
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [entries, setEntries] = useState<ICallListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState<ICallListEntry | null>(null);
  const [noting, setNoting] = useState<ICallListEntry | null>(null);

  useEffect(() => {
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  const latest = useRef(0);
  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    try {
      const found = await fetchCallList({ date, routeId: routeId === ALL ? undefined : routeId, includeDone });
      if (request === latest.current) setEntries(found);
    } catch (error) {
      if (request === latest.current) toast.error(wholesaleErrorMessage(error, 'The call list could not be loaded.'));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [date, routeId, includeDone]);

  useEffect(() => {
    load();
  }, [load]);

  const routeName = (id?: string | null) => (id ? routes.find(r => r.id === id)?.name ?? id : 'No route');
  const pending = entries.filter(e => e.pending).length;

  return (
    <WholesalePage
      title="Call List"
      context={`${formatDay(date)} / ${routeId === ALL ? 'all routes' : routeName(routeId)} / ${pending} to call`}
      actions={
        <>
          <Input aria-label="Delivery date" type="date" className="ws-control w-40" value={date} onChange={e => e.target.value && setDate(e.target.value)} />
          <Select value={routeId} onValueChange={setRouteId}>
            <SelectTrigger className="ws-control w-44" aria-label="Route">
              <SelectValue />
            </SelectTrigger>
            <WsSelectContent>
              <SelectItem value={ALL}>All routes</SelectItem>
              {routes.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </WsSelectContent>
          </Select>
          <label className="flex items-center gap-2 text-[13px]">
            <Checkbox checked={includeDone} onCheckedChange={checked => setIncludeDone(checked === true)} />
            Show done
          </label>
        </>
      }
    >
      <div className="ws-card overflow-x-auto">
        <table className="ws-table">
          <thead>
            <tr>
              <th className="w-12">Stop</th>
              <th>Customer</th>
              <th>Route</th>
              <th>Status</th>
              <th>Last call</th>
              <th>Follow up</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-muted-foreground">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted-foreground">
                  {includeDone ? 'No customers deliver on this date.' : 'Everyone has been called for this date.'}
                </td>
              </tr>
            )}
            {!loading &&
              entries.map(e => (
                <tr key={e.customerId}>
                  <td className="ws-mono text-muted-foreground">{e.stopSequence ?? ''}</td>
                  <td>
                    <div className="font-medium">{e.name}</div>
                    <div className="ws-mono text-xs text-muted-foreground">
                      {[e.accountNumber, e.phone].filter(Boolean).join(' / ')}
                      {e.phone && (
                        <a href={`tel:${e.phone}`} className="ml-2 text-primary hover:underline">
                          call
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{routeName(e.routeId)}</td>
                  <td>
                    {e.orderIds.length > 0 ? (
                      <WholesaleStatusBadge tone="approved">Ordered</WholesaleStatusBadge>
                    ) : e.pending ? (
                      <WholesaleStatusBadge tone="amendment">To call</WholesaleStatusBadge>
                    ) : (
                      <WholesaleStatusBadge tone="neutral">Done</WholesaleStatusBadge>
                    )}
                  </td>
                  <td className="text-[13px]">
                    {e.lastOutcome ? (
                      <>
                        <span className="font-medium">{outcomeLabel(e.lastOutcome)}</span>
                        <span className="ml-1.5 text-muted-foreground">
                          {when(e.lastCallAt)}
                          {e.lastCalledBy ? ` by ${e.lastCalledBy}` : ''}
                          {e.callCount > 1 ? ` (${e.callCount} calls)` : ''}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not called</span>
                    )}
                  </td>
                  <td className="ws-mono text-[13px]">{when(e.followUpAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="sm" className="ws-control" onClick={() => setCalling(e)}>
                        Log call
                      </Button>
                      <Button asChild size="sm" className="ws-control">
                        <Link to={`/logistics/order-entry?date=${date}&customerId=${e.customerId}&from=call-list`}>Take order</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="ws-control" onClick={() => setNoting(e)}>
                        Note
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {calling && (
        <LogCallDialog
          open
          customerId={calling.customerId}
          customerName={calling.name}
          deliveryDate={date}
          onClose={() => setCalling(null)}
          onSaved={() => {
            setCalling(null);
            load();
          }}
        />
      )}
      {noting && (
        <CustomerNoteDialog
          open
          customerId={noting.customerId}
          customerName={noting.name}
          source="CALL_LIST"
          onClose={() => setNoting(null)}
          onSaved={() => setNoting(null)}
        />
      )}
    </WholesalePage>
  );
};

export default CallList;
