import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { formatDay, formatRange, toIsoDate } from '../closures/closure.model';
import { money } from '../delivery/delivery.model';
import { FilterOption, SelectFilter, optionsFrom } from '../delivery/credit-filters';
import { fetchInvoiceList } from './audits.api';
import { INVOICE_STATUS, IInvoiceFilters, IInvoicePage, InvoiceStatus, invoiceLabel } from './audits.model';
import { Stat } from './reconciliation';
import { invoicePrintLink } from './customer-account-sheet';

const PAGE_SIZE = 50;

export const thisMonth = (now = new Date()): IInvoiceFilters => {
  const to = toIsoDate(now);
  return { from: `${to.slice(0, 8)}01`, to, page: 0, size: PAGE_SIZE };
};

/** Every issued invoice in a period, filterable by factory, route, customer, number and payment status, with a reprint. */
const Invoices = () => {
  const [filters, setFilters] = useState<IInvoiceFilters>(() => thisMonth());
  const [number, setNumber] = useState('');
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [customers, setCustomers] = useState<FilterOption[]>([]);
  const [result, setResult] = useState<IInvoicePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setFilters(prev => (prev.number === (number.trim() || null) ? prev : { ...prev, number: number.trim() || null, page: 0 })), 300);
    return () => window.clearTimeout(timer);
  }, [number]);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    try {
      const page = await fetchInvoiceList(filters);
      if (current !== request.current) return;
      setResult(page);
      if (!filters.customerId) setCustomers(optionsFrom(page.rows, r => r.customerId, r => r.customerName));
    } catch (error) {
      if (current !== request.current) return;
      setResult(null);
      toast.error(wholesaleErrorMessage(error, 'The invoices could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const change = (patch: Partial<IInvoiceFilters>) => setFilters(prev => ({ ...prev, ...patch, page: 0 }));
  const factoryName = (id?: string | null) => factories.find(f => f.id === id)?.name ?? '';
  const routeName = (id?: string | null) => routes.find(r => r.id === id)?.name ?? '';
  const rows = result?.rows ?? [];
  const totals = result?.totals;
  const pages = result ? Math.max(1, Math.ceil(result.totalRows / result.size)) : 1;

  return (
    <WholesalePage title="Invoices" context={formatRange(filters.from, filters.to)}>
      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" aria-label="From" className="ws-control w-40" value={filters.from} max={filters.to} onChange={e => e.target.value && change({ from: e.target.value })} />
        <span className="text-sm text-muted-foreground">to</span>
        <Input type="date" aria-label="To" className="ws-control w-40" value={filters.to} min={filters.from} onChange={e => e.target.value && change({ to: e.target.value })} />
        {factories.length > 1 && (
          <SelectFilter
            label="Factory"
            value={filters.factoryId}
            anyLabel="All factories"
            options={factories.map(f => ({ value: f.id, label: f.name ?? f.id }))}
            onChange={factoryId => change({ factoryId })}
          />
        )}
        <SelectFilter
          label="Route"
          value={filters.routeDefinitionId}
          anyLabel="All routes"
          options={routes.filter(r => !filters.factoryId || r.factoryId === filters.factoryId).map(r => ({ value: r.id, label: r.name ?? r.id }))}
          onChange={routeDefinitionId => change({ routeDefinitionId })}
        />
        <SelectFilter label="Customer" value={filters.customerId} anyLabel="All customers" options={customers} onChange={customerId => change({ customerId })} />
        <SelectFilter
          label="Status"
          value={filters.status}
          anyLabel="Any status"
          options={Object.entries(INVOICE_STATUS).map(([value, s]) => ({ value, label: s.label }))}
          onChange={status => change({ status: status as InvoiceStatus | null })}
        />
        <Input className="ws-control ws-mono w-36" placeholder="Invoice #" aria-label="Invoice number" value={number} onChange={e => setNumber(e.target.value)} />
      </div>

      {totals && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Invoices" value={totals.count} />
          <Stat label="Invoiced" value={money(totals.total)} />
          <Stat label="Paid" value={money(totals.paid)} hint={totals.onAccountCharged ? `${money(totals.onAccountCharged)} put on account` : undefined} />
          <Stat label="Open" value={money(totals.open)} tone={totals.open > 0.005 ? 'bad' : undefined} />
        </div>
      )}

      <div className="ws-card overflow-x-auto">
        <table className="ws-table" data-testid="invoice-list">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Route</th>
              <th className="text-right">Total</th>
              <th className="text-right">Paid</th>
              <th className="text-right">Open</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.billId ?? r.orderId}>
                <td className="ws-mono font-medium">{invoiceLabel(r)}</td>
                <td>{r.invoiceDate ? formatDay(r.invoiceDate) : ''}</td>
                <td>
                  {r.customerId ? <Link to={`/logistics/customer-accounts?customer=${r.customerId}`}>{r.customerName ?? 'Customer'}</Link> : r.customerName}
                </td>
                <td>
                  {routeName(r.routeDefinitionId)}
                  {factories.length > 1 && <div className="text-xs text-muted-foreground">{factoryName(r.factoryId)}</div>}
                </td>
                <td className="text-right">{money(r.total)}</td>
                <td className="text-right">{money(r.paid + r.onAccountSettled)}</td>
                <td className="text-right font-semibold">{r.open > 0.005 ? money(r.open) : ''}</td>
                <td>
                  <WholesaleStatusBadge tone={INVOICE_STATUS[r.status].tone}>{INVOICE_STATUS[r.status].label}</WholesaleStatusBadge>
                </td>
                <td className="whitespace-nowrap text-right">
                  <Link to={invoicePrintLink(r.orderId, r.billId)} className="text-sm text-primary hover:underline">
                    Print
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  {loading ? 'Loading invoices...' : 'No invoices match these filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {result && result.totalRows > result.size && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">
            Page {result.page + 1} of {pages}, {result.totalRows} invoices
          </span>
          <Button variant="outline" size="sm" className="ws-control" disabled={result.page === 0} onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ws-control"
            disabled={result.page + 1 >= pages}
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </WholesalePage>
  );
};

export default Invoices;
