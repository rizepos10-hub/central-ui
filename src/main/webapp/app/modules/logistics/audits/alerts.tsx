import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsAlertDialogContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { addDays, formatDay, toIsoDate } from '../closures/closure.model';
import { formatTime } from '../operations/operations.model';
import { money } from '../delivery/delivery.model';
import { SelectFilter } from '../delivery/credit-filters';
import { acknowledgeAlert, fetchAlerts } from './audits.api';
import { ALERT_STATUS_LABEL, ALERT_TYPE_LABEL, AlertStatus, AlertType, IAlert, IAlertFilters } from './audits.model';
import { useAlertUpdates } from './audits-socket';

const MAX_NOTE = 1000;

export const lastMonth = (now = new Date()): IAlertFilters => {
  const to = toIsoDate(now);
  return { from: addDays(to, -29), to, status: 'OPEN' };
};

/** Things a bookkeeper should look at: cash not handed in, unexplained changes, over-deliveries, unpaid cash-only stops and high stale rates. */
const Alerts = () => {
  const [filters, setFilters] = useState<IAlertFilters>(() => lastMonth());
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<IAlert | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    try {
      const result = await fetchAlerts(filters);
      if (current === request.current) setAlerts(result);
    } catch (error) {
      if (current !== request.current) return;
      setAlerts([]);
      toast.error(wholesaleErrorMessage(error, 'The alerts could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useAlertUpdates(load);

  const factoryName = (id?: string | null) => factories.find(f => f.id === id)?.name;

  const acknowledge = async () => {
    if (!acknowledging || note.length > MAX_NOTE) return;
    setBusy(true);
    try {
      await acknowledgeAlert(acknowledging.id, note.trim() || null);
      toast.success('Alert acknowledged');
      setAcknowledging(null);
      load();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The alert could not be acknowledged.'));
    } finally {
      setBusy(false);
    }
  };

  const open = alerts.filter(a => a.status === 'OPEN').length;

  return (
    <WholesalePage title="Alerts" context={open > 0 ? `${open} open` : 'Nothing waiting'}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          aria-label="From"
          className="ws-control w-40"
          value={filters.from}
          max={filters.to}
          onChange={e => e.target.value && setFilters({ ...filters, from: e.target.value })}
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          aria-label="To"
          className="ws-control w-40"
          value={filters.to}
          min={filters.from}
          onChange={e => e.target.value && setFilters({ ...filters, to: e.target.value })}
        />
        <SelectFilter
          label="Status"
          value={filters.status}
          anyLabel="Open and acknowledged"
          options={Object.entries(ALERT_STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          onChange={status => setFilters({ ...filters, status: status as AlertStatus | null })}
        />
        <SelectFilter
          label="Type"
          value={filters.type}
          anyLabel="All types"
          options={Object.entries(ALERT_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
          onChange={type => setFilters({ ...filters, type: type as AlertType | null })}
        />
        {factories.length > 1 && (
          <SelectFilter
            label="Factory"
            value={filters.factoryId}
            anyLabel="All factories"
            options={factories.map(f => ({ value: f.id, label: f.name ?? f.id }))}
            onChange={factoryId => setFilters({ ...filters, factoryId })}
          />
        )}
      </div>

      <div className="ws-card overflow-x-auto">
        <table className="ws-table" data-testid="alert-list">
          <thead>
            <tr>
              <th>Raised</th>
              <th>Alert</th>
              <th>Customer</th>
              <th>Run</th>
              <th className="text-right">Amount</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.id}>
                <td className="whitespace-nowrap">
                  {a.deliveryDate ? formatDay(a.deliveryDate) : ''}
                  <div className="text-xs text-muted-foreground">{formatTime(a.raisedAt)}</div>
                </td>
                <td>
                  <div className="font-medium">{ALERT_TYPE_LABEL[a.type] ?? a.type}</div>
                  {a.message && <div className="text-xs text-muted-foreground">{a.message}</div>}
                </td>
                <td>
                  {a.customerId ? (
                    <Link to={`/logistics/customer-accounts?customer=${a.customerId}`}>{a.customerName ?? 'Customer'}</Link>
                  ) : (
                    (a.customerName ?? '')
                  )}
                </td>
                <td>
                  {a.runName ?? ''}
                  {a.driverUsername && <div className="text-xs text-muted-foreground">{a.driverUsername}</div>}
                  {factories.length > 1 && factoryName(a.factoryId) && <div className="text-xs text-muted-foreground">{factoryName(a.factoryId)}</div>}
                </td>
                <td className="text-right">{a.amount != null ? money(a.amount) : ''}</td>
                <td>
                  {a.status === 'OPEN' ? (
                    <WholesaleStatusBadge tone="returned">Open</WholesaleStatusBadge>
                  ) : (
                    <div>
                      <WholesaleStatusBadge tone="approved">Acknowledged</WholesaleStatusBadge>
                      <div className="text-xs text-muted-foreground">
                        {a.acknowledgedBy} {formatTime(a.acknowledgedAt)}
                      </div>
                      {a.acknowledgeNote && <div className="text-xs">{a.acknowledgeNote}</div>}
                    </div>
                  )}
                </td>
                <td className="text-right">
                  {a.status === 'OPEN' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="ws-control"
                      onClick={() => {
                        setNote('');
                        setAcknowledging(a);
                      }}
                    >
                      Acknowledge
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {loading ? 'Loading alerts...' : 'No alerts match these filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!acknowledging} onOpenChange={on => !on && setAcknowledging(null)}>
        <WsAlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acknowledge this alert?</AlertDialogTitle>
            <AlertDialogDescription>{acknowledging ? (acknowledging.message ?? ALERT_TYPE_LABEL[acknowledging.type]) : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="ws-alert-note">Note</Label>
            <Textarea id="ws-alert-note" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="What was done about it (optional)" />
            {note.length > MAX_NOTE && <span className="text-xs text-destructive">Use at most {MAX_NOTE} characters</span>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="ws-control" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="ws-control"
              disabled={busy || note.length > MAX_NOTE}
              onClick={e => {
                e.preventDefault();
                acknowledge();
              }}
            >
              Acknowledge
            </AlertDialogAction>
          </AlertDialogFooter>
        </WsAlertDialogContent>
      </AlertDialog>
    </WholesalePage>
  );
};

export default Alerts;
