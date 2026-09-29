import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { WHOLESALE_PAGE_ROLES } from '../wholesale-access';
import { CancelOrderButton } from './cancel-order-button';
import { searchOrders } from './order-search.api';
import {
  IOrderRow,
  IOrderSearch,
  OrderPaymentFilter,
  PAYMENT_FILTERS,
  STAGE_LABEL,
  STAGE_TONE,
  STATUS_FILTERS,
  orderLabel,
  ordersLink,
  paymentLabel,
  searchFromParams,
} from './order-search.model';
import { formatDay, money } from './sales.model';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

/** Wholesale orders by status: what is still open, with the factory, delivered or cancelled, and what is unpaid. */
const Orders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canCancel = hasAnyAuthority(authorities, WHOLESALE_PAGE_ROLES.orderEntry);

  const [search, setSearch] = useState<IOrderSearch>(() => searchFromParams(searchParams, PAGE_SIZE));
  const [text, setText] = useState(search.search ?? '');
  const [rows, setRows] = useState<IOrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const update = (change: Partial<IOrderSearch>) => {
    const next = { ...search, page: 0, ...change };
    setSearch(next);
    setSearchParams(new URLSearchParams(ordersLink(next).split('?')[1] ?? ''), { replace: true });
  };

  useEffect(() => {
    if (text === (search.search ?? '')) return undefined;
    const timer = window.setTimeout(() => update({ search: text.trim() || undefined }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text]);

  const latest = useRef(0);
  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    try {
      const page = await searchOrders(search);
      if (request !== latest.current) return;
      setRows(page.rows);
      setTotal(page.total);
    } catch (error) {
      if (request === latest.current) toast.error(wholesaleErrorMessage(error, 'The orders could not be loaded.'));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const replaceRow = (updated: IOrderRow) => {
    if (search.status === 'ALL' || search.status === updated.stage) {
      setRows(prev => prev.map(r => (r.id === updated.id ? updated : r)));
    } else {
      setRows(prev => prev.filter(r => r.id !== updated.id));
      setTotal(t => Math.max(0, t - 1));
    }
  };

  const customerName = search.customerId ? rows.find(r => r.customerId === search.customerId)?.customerName ?? 'This customer' : null;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusLabel = STATUS_FILTERS.find(s => s.value === search.status)?.label.toLowerCase();

  return (
    <WholesalePage title="Orders" context={loading ? 'Loading...' : `${total} ${statusLabel} order${total === 1 ? '' : 's'}${customerName ? ` for ${customerName}` : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full border bg-card" role="group" aria-label="Status">
          {STATUS_FILTERS.map(s => (
            <button
              key={s.value}
              type="button"
              aria-pressed={search.status === s.value}
              onClick={() => update({ status: s.value })}
              className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px]', search.status === s.value && 'bg-accent font-semibold text-accent-foreground')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Select value={search.payment} onValueChange={value => update({ payment: value as OrderPaymentFilter })}>
          <SelectTrigger className="ws-control w-36" aria-label="Payment">
            <SelectValue />
          </SelectTrigger>
          <WsSelectContent>
            {PAYMENT_FILTERS.map(p => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </WsSelectContent>
        </Select>
        {search.customerId ? (
          <span className="inline-flex h-[var(--ws-control-h)] items-center gap-1 rounded-full border bg-card pl-3 pr-1 text-[13px]">
            {customerName}
            <button type="button" aria-label="Show all customers" className="rounded-full p-1 hover:bg-muted" onClick={() => update({ customerId: undefined })}>
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : (
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search customer" placeholder="Customer name or account" className="ws-control pl-8" value={text} onChange={e => setText(e.target.value)} />
          </div>
        )}
        <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          Delivery from
          <Input aria-label="Delivery from" type="date" className="ws-control w-40" value={search.from ?? ''} onChange={e => update({ from: e.target.value || undefined })} />
        </label>
        <label className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          to
          <Input aria-label="Delivery to" type="date" className="ws-control w-40" value={search.to ?? ''} onChange={e => update({ to: e.target.value || undefined })} />
        </label>
      </div>

      <div className="ws-card overflow-hidden">
        <table className="ws-table">
          <thead>
            <tr>
              <th className="w-8" />
              <th>Order</th>
              <th>Customer</th>
              <th>Delivery</th>
              <th>Route</th>
              <th>Status</th>
              <th>Payment</th>
              <th className="ws-num">Total</th>
              <th className="ws-num">Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const open = expanded === row.id;
              return (
                <React.Fragment key={row.id}>
                  <tr className="cursor-pointer" onClick={() => setExpanded(open ? null : row.id)} aria-expanded={open}>
                    <td>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                    <td className="ws-mono">{orderLabel(row)}</td>
                    <td>
                      <span className="font-medium">{row.customerName}</span>
                      {row.accountNumber && <span className="ws-mono ml-2 text-xs text-muted-foreground">{row.accountNumber}</span>}
                    </td>
                    <td>{row.deliveryDate ? formatDay(row.deliveryDate) : '-'}</td>
                    <td>{row.routeName ?? '-'}</td>
                    <td>
                      <WholesaleStatusBadge tone={STAGE_TONE[row.stage]}>{STAGE_LABEL[row.stage]}</WholesaleStatusBadge>
                    </td>
                    <td>{paymentLabel(row.paymentStatus)}</td>
                    <td className="ws-num">{money(row.total)}</td>
                    <td className="ws-num">{money(row.amountDue)}</td>
                  </tr>
                  {open && (
                    <tr>
                      <td />
                      <td colSpan={8} className="py-3">
                        <div className="grid gap-2">
                          {row.lines.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No items.</span>
                          ) : (
                            <ul className="m-0 grid list-none gap-0.5 p-0 text-[13px]" aria-label={`Items of order ${orderLabel(row)}`}>
                              {row.lines.map((line, i) => (
                                <li key={i}>
                                  <span className="ws-mono">{line.quantity}</span> x {line.name}
                                  {line.price != null && <span className="text-muted-foreground"> at {money(line.price)}</span>}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {!search.customerId && (
                              <Link to={ordersLink({ ...search, customerId: row.customerId, search: undefined })} className="text-[13px] text-primary hover:underline">
                                All orders of {row.customerName}
                              </Link>
                            )}
                            <div className="flex-1" />
                            {canCancel && <CancelOrderButton row={row} onCancelled={replaceRow} />}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span className="text-muted-foreground">
            Page {search.page + 1} of {pages}
          </span>
          <Button variant="outline" className="ws-control" disabled={search.page === 0 || loading} onClick={() => setSearch(s => ({ ...s, page: s.page - 1 }))}>
            Previous
          </Button>
          <Button variant="outline" className="ws-control" disabled={search.page + 1 >= pages || loading} onClick={() => setSearch(s => ({ ...s, page: s.page + 1 }))}>
            Next
          </Button>
        </div>
      )}
    </WholesalePage>
  );
};

export default Orders;
