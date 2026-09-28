import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Input } from '@/components/ui/input';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { formatDay, toIsoDate } from '../closures/closure.model';
import { money } from '../delivery/delivery.model';
import { SelectFilter } from '../delivery/credit-filters';
import { fetchAging } from './audits.api';
import { AGING_COLUMNS, IAgingReport, IAgingRow } from './audits.model';
import { Stat } from './reconciliation';
import { CustomerAccountSheet } from './customer-account-sheet';

const { ADMIN, WHOLESALE_ADMIN, WHOLESALE_BOOKKEEPER } = AUTHORITIES;

export const overdue = (row: { aging: IAgingRow['aging'] }) => row.aging.total - row.aging.current;

export const filterAging = (rows: IAgingRow[], search: string) => {
  const text = search.trim().toLowerCase();
  return text ? rows.filter(r => (r.customerName ?? '').toLowerCase().includes(text)) : rows;
};

/** What each customer owes by age, with the customer's account, statement and office payments one click away. */
const CustomerAccounts = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canManage = hasAnyAuthority(authorities, [ADMIN, WHOLESALE_ADMIN, WHOLESALE_BOOKKEEPER]);
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get('customer');

  const [asOf, setAsOf] = useState(() => toIsoDate(new Date()));
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [report, setReport] = useState<IAgingReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    try {
      const result = await fetchAging(asOf, factoryId, routeId);
      if (current === request.current) setReport(result);
    } catch (error) {
      if (current !== request.current) return;
      setReport(null);
      toast.error(wholesaleErrorMessage(error, 'The customer balances could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [asOf, factoryId, routeId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const rows = useMemo(() => filterAging(report?.customers ?? [], search), [report, search]);
  const total = report?.total;

  const openCustomer = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('customer', id);
    else next.delete('customer');
    setSearchParams(next, { replace: true });
  };

  return (
    <WholesalePage title="Customer Accounts" context={`What customers owe on ${formatDay(asOf)}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" aria-label="As of" className="ws-control w-40" value={asOf} onChange={e => e.target.value && setAsOf(e.target.value)} />
        {factories.length > 1 && (
          <SelectFilter
            label="Factory"
            value={factoryId}
            anyLabel="All factories"
            options={factories.map(f => ({ value: f.id, label: f.name ?? f.id }))}
            onChange={setFactoryId}
          />
        )}
        <SelectFilter
          label="Route"
          value={routeId}
          anyLabel="All routes"
          options={routes.filter(r => !factoryId || r.factoryId === factoryId).map(r => ({ value: r.id, label: r.name ?? r.id }))}
          onChange={setRouteId}
        />
        <Input className="ws-control w-56" placeholder="Search customers" aria-label="Search customers" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {total && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Owed" value={money(total.total)} hint={`${report.customers.length} customers`} />
          <Stat label="Overdue" value={money(total.total - total.current)} tone={total.total - total.current > 0.005 ? 'bad' : undefined} />
          <Stat label="Over 60 days" value={money(total.days61to90 + total.days90plus)} />
          <Stat label="Open credit" value={money(report.openCredit)} hint="Credit memos not applied yet" />
        </div>
      )}

      <div className="ws-card overflow-x-auto">
        <table className="ws-table" data-testid="aging">
          <thead>
            <tr>
              <th>Customer</th>
              {AGING_COLUMNS.map(c => (
                <th key={c.key} className="text-right">
                  {c.label}
                </th>
              ))}
              <th className="text-right">Total</th>
              <th className="text-right">Invoices</th>
              <th>Oldest</th>
              <th className="text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.customerId} className="cursor-pointer" onClick={() => openCustomer(r.customerId)}>
                <td className="font-medium">{r.customerName ?? 'Customer'}</td>
                {AGING_COLUMNS.map(c => (
                  <td key={c.key} className="text-right">
                    {r.aging[c.key] ? money(r.aging[c.key]) : ''}
                  </td>
                ))}
                <td className="text-right font-semibold">{money(r.aging.total)}</td>
                <td className="text-right">{r.openInvoices}</td>
                <td>{r.oldestOpenInvoiceDate ? formatDay(r.oldestOpenInvoiceDate, false) : ''}</td>
                <td className="text-right">{r.openCredit ? money(r.openCredit) : ''}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={AGING_COLUMNS.length + 5} className="py-8 text-center text-muted-foreground">
                  {loading ? 'Loading balances...' : search ? 'No customer matches the search.' : 'No customer owes anything.'}
                </td>
              </tr>
            )}
            {total && rows.length > 0 && !search && (
              <tr className="font-semibold">
                <td>Total</td>
                {AGING_COLUMNS.map(c => (
                  <td key={c.key} className="text-right">
                    {money(total[c.key])}
                  </td>
                ))}
                <td className="text-right">{money(total.total)}</td>
                <td colSpan={2} />
                <td className="text-right">{money(report.openCredit)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CustomerAccountSheet customerId={customerId} asOf={asOf} canManage={canManage} onClose={() => openCustomer(null)} onChanged={load} />
    </WholesalePage>
  );
};

export default CustomerAccounts;
