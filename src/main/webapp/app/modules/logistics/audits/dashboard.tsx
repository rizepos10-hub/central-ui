import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { addDays, formatDay, formatRange, parseIsoDate, toIsoDate } from '../closures/closure.model';
import { formatQty } from '../operations/operations.model';
import { money } from '../delivery/delivery.model';
import { SelectFilter } from '../delivery/credit-filters';
import { useDeliveryUpdates } from '../delivery/delivery-socket';
import { WHOLESALE_PAGE_ROLES } from '../wholesale-access';
import { fetchDashboard } from './audits.api';
import { IDashboard, MAX_DASHBOARD_DAYS, percent } from './audits.model';
import { Stat } from './reconciliation';

type Preset = 'today' | 'week' | 'month';

export const presetRange = (preset: Preset, now = new Date()) => {
  const to = toIsoDate(now);
  if (preset === 'today') return { from: to, to };
  if (preset === 'week') return { from: addDays(to, -6), to };
  return { from: `${to.slice(0, 8)}01`, to };
};

export const rangeDays = (from: string, to: string) => Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / 86400000) + 1;

const Linked = ({ to, allowed, children }: { to: string; allowed: boolean; children: React.ReactNode }) =>
  allowed ? (
    <Link to={to} className="block rounded-md no-underline hover:ring-1 hover:ring-primary">
      {children}
    </Link>
  ) : (
    <>{children}</>
  );

/** The wholesale day at a glance: orders, deliveries, money collected, receivables, alerts and stale returns. */
const Dashboard = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const can = (page: keyof typeof WHOLESALE_PAGE_ROLES) => hasAnyAuthority(authorities, WHOLESALE_PAGE_ROLES[page]);

  const [range, setRange] = useState(() => presetRange('today'));
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [data, setData] = useState<IDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
  }, []);

  const tooLong = rangeDays(range.from, range.to) > MAX_DASHBOARD_DAYS;

  const request = useRef(0);
  const load = useCallback(async () => {
    if (tooLong) return;
    const current = ++request.current;
    try {
      const result = await fetchDashboard(range.from, range.to, factoryId);
      if (current === request.current) setData(result);
    } catch (error) {
      if (current !== request.current) return;
      setData(null);
      toast.error(wholesaleErrorMessage(error, 'The dashboard could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [range, factoryId, tooLong]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useDeliveryUpdates(event => {
    if (!event?.deliveryDate || (event.deliveryDate >= range.from && event.deliveryDate <= range.to)) load();
  }, 120000);

  const d = data;
  const collected = d ? d.money.cash + d.money.checks : 0;

  return (
    <WholesalePage title="Dashboard" context={formatRange(range.from, range.to)}>
      <div className="flex flex-wrap items-center gap-2">
        {(['today', 'week', 'month'] as Preset[]).map(p => {
          const r = presetRange(p);
          const active = r.from === range.from && r.to === range.to;
          return (
            <Button key={p} size="sm" variant={active ? 'default' : 'outline'} className="ws-control" onClick={() => setRange(r)}>
              {p === 'today' ? 'Today' : p === 'week' ? 'Last 7 days' : 'This month'}
            </Button>
          );
        })}
        <Input type="date" aria-label="From" className="ws-control w-40" value={range.from} max={range.to} onChange={e => e.target.value && setRange({ ...range, from: e.target.value })} />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" aria-label="To" className="ws-control w-40" value={range.to} min={range.from} onChange={e => e.target.value && setRange({ ...range, to: e.target.value })} />
        {factories.length > 1 && (
          <SelectFilter
            label="Factory"
            value={factoryId}
            anyLabel="All factories"
            options={factories.map(f => ({ value: f.id, label: f.name ?? f.id }))}
            onChange={setFactoryId}
          />
        )}
      </div>

      {tooLong && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Choose a range of {MAX_DASHBOARD_DAYS} days or less.</div>}

      {!d && !tooLong && <div className="py-10 text-center text-sm text-muted-foreground">{loading ? 'Loading dashboard...' : 'Nothing to show.'}</div>}

      {d && !tooLong && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" data-testid="dashboard-stats">
            <Stat label="Orders" value={d.orders.count} hint={`${d.orders.customers} customers, ${money(d.orders.value)}`} />
            <Stat label="Delivered" value={formatQty(d.quantities.delivered)} hint={`of ${formatQty(d.quantities.approved)} approved`} />
            <Linked to="/logistics/reconciliation" allowed={can('reconciliation')}>
              <Stat label="Invoiced" value={money(d.money.invoiced)} hint={`${money(collected)} collected`} />
            </Linked>
            <Stat label="Not paid" value={money(d.money.notPaid)} hint={`${money(d.money.onAccount)} on account`} tone={d.money.notPaid > 0.005 ? 'bad' : undefined} />
            <Linked to="/logistics/stale-returns" allowed={can('staleReturns')}>
              <Stat label="Stale rate" value={percent(d.staleRatePercent)} hint={`${formatQty(d.quantities.staleReturned)} returned`} />
            </Linked>
            <Linked to="/logistics/alerts" allowed={can('alerts')}>
              <Stat label="Open alerts" value={d.openAlerts} tone={d.openAlerts > 0 ? 'bad' : 'good'} />
            </Linked>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Linked to="/logistics/delivery-runs" allowed={can('deliveryRuns')}>
              <Stat
                label="Runs"
                value={`${d.runs.submitted} / ${d.runs.total} submitted`}
                hint={`${d.runs.inProgress} on the road, ${d.runs.notStarted} not started`}
              />
            </Linked>
            <Stat label="Stops done" value={`${d.runs.stopsDone} / ${d.runs.stopsTotal}`} />
            <Linked to="/logistics/cash-handover" allowed={can('cashHandover')}>
              <Stat
                label="Handovers closed"
                value={`${d.runs.handoversClosed} / ${d.runs.total}`}
                hint={Math.abs(d.money.cashDifference) >= 0.005 ? `${money(d.money.cashDifference)} difference` : undefined}
                tone={Math.abs(d.money.cashDifference) >= 0.005 ? 'bad' : undefined}
              />
            </Linked>
            <Linked to="/logistics/factory-orders" allowed={can('factoryOrders')}>
              <Stat
                label="Factory shortages"
                value={d.shortages.lines}
                hint={d.shortages.lines > 0 ? `${formatQty(d.shortages.quantity)} short on ${d.shortages.factoryOrders} factory orders` : 'None'}
              />
            </Linked>
            <Linked to="/logistics/customer-accounts" allowed={can('customerAccounts')}>
              <Stat label="Receivables" value={money(d.receivables.total)} hint={`${d.receivables.customers} customers on ${formatDay(d.to, false)}`} />
            </Linked>
            <Stat
              label="Overdue"
              value={money(d.receivables.overdue)}
              hint={d.receivables.openCredit ? `${money(d.receivables.openCredit)} open credit` : undefined}
              tone={d.receivables.overdue > 0.005 ? 'bad' : undefined}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            {d.trend.length > 1 && (
              <div className="ws-card p-4" data-testid="dashboard-trend">
                <h2 className="m-0 mb-2 text-base font-semibold">Per day</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.trend.map(p => ({ ...p, day: formatDay(p.date, false) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(value: number) => money(value)} />
                      <Legend />
                      <Bar dataKey="orderValue" name="Ordered" fill="hsl(var(--muted-foreground))" />
                      <Bar dataKey="invoiced" name="Invoiced" fill="hsl(var(--primary))" />
                      <Bar dataKey="cash" name="Cash" stackId="paid" fill="hsl(var(--ws-approved))" />
                      <Bar dataKey="checks" name="Checks" stackId="paid" fill="hsl(var(--ws-returned))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="ws-card overflow-x-auto">
              <h2 className="m-0 px-4 pt-3 text-base font-semibold">Most stale returns</h2>
              <table className="ws-table" data-testid="stale-customers">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="text-right">Delivered</th>
                    <th className="text-right">Returned</th>
                    <th className="text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {d.topStaleCustomers.map(c => (
                    <tr key={c.customerId}>
                      <td>{c.customerName ?? 'Customer'}</td>
                      <td className="text-right">{formatQty(c.delivered)}</td>
                      <td className="text-right">{formatQty(c.staleReturned)}</td>
                      <td className="text-right font-semibold">{percent(c.ratePercent)}</td>
                    </tr>
                  ))}
                  {d.topStaleCustomers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-muted-foreground">
                        No stale returns.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </WholesalePage>
  );
};

export default Dashboard;
