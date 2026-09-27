import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { AddWholesaleCustomerDialog } from './add-wholesale-customer-dialog';
import { CustomerProfileEditor } from './customer-profile-editor';
import { fetchRouteDefinitions, fetchWholesaleCustomers } from './wholesale-customer.api';
import { IWholesaleCustomer, IWholesaleRouteDefinition, customerName, daysLabel, paymentMethodLabel } from './wholesale-customer.model';

const PAGE_SIZE = 50;
const ALL = '__all';

type Status = 'all' | 'active' | 'paused';

const STATUS_FILTER: Record<Status, boolean | undefined> = { all: undefined, active: true, paused: false };

const WholesaleCustomers = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canEdit = hasAnyAuthority(authorities, [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_SALES_MANAGER]);

  const [customers, setCustomers] = useState<IWholesaleCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);

  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [routeId, setRouteId] = useState(ALL);
  const [factoryId, setFactoryId] = useState(ALL);
  const [page, setPage] = useState(0);

  const [editing, setEditing] = useState<IWholesaleCustomer | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // Lookups are optional: without them the table shows ids and the editor has no suggestion preview.
    fetchFactories()
      .then(setFactories)
      .catch(() => setFactories([]));
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => setPage(0), [search, status, routeId, factoryId]);

  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestRequest.current;
    setLoading(true);
    try {
      const result = await fetchWholesaleCustomers({
        active: STATUS_FILTER[status],
        routeId: routeId === ALL ? undefined : routeId,
        factoryId: factoryId === ALL ? undefined : factoryId,
        search,
        page,
        size: PAGE_SIZE,
      });
      if (request !== latestRequest.current) return;
      setCustomers(result.items);
      setTotal(result.total);
    } catch (error) {
      if (request === latestRequest.current) toast.error(wholesaleErrorMessage(error, 'The wholesale customers could not be loaded.'));
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, [status, routeId, factoryId, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const routeName = (id?: string | null) => (id ? routes.find(r => r.id === id)?.name ?? id : null);
  const factoryName = (id?: string | null) => (id ? factories.find(f => f.id === id)?.name ?? id : null);

  const onSaved = () => {
    setEditing(null);
    load();
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <WholesalePage
      title="Wholesale Customers"
      context={`${total} ${status === 'all' ? '' : `${status} `}wholesale customer${total === 1 ? '' : 's'} / route, delivery days, factory and payment`}
      actions={
        canEdit && (
          <Button className="ws-control" onClick={() => setAdding(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add wholesale customer
          </Button>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search wholesale customers"
            placeholder="Name, phone, email, account"
            className="ws-control pl-8"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <div className="inline-flex overflow-hidden rounded-full border bg-card" role="group" aria-label="Status">
          {(['all', 'active', 'paused'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px] capitalize', status === s && 'bg-accent font-semibold text-accent-foreground')}
            >
              {s}
            </button>
          ))}
        </div>
        <Select value={routeId} onValueChange={setRouteId}>
          <SelectTrigger className="ws-control w-48" aria-label="Route filter">
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
        <Select value={factoryId} onValueChange={setFactoryId}>
          <SelectTrigger className="ws-control w-48" aria-label="Factory filter">
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
        {!canEdit && <span className="text-xs text-muted-foreground">Read only.</span>}
      </div>

      <div className="ws-card overflow-hidden">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Route</th>
              <th>Days</th>
              <th>Factory</th>
              <th>Payment</th>
              <th className="ws-num">Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              customers.map(c => {
                const p = c.wholesaleProfile ?? {};
                return (
                  <tr key={c.id} className="cursor-pointer" onClick={() => setEditing(c)}>
                    <td>
                      <span className="font-medium">{customerName(c)}</span>
                      {c.accountNumber && <span className="ws-mono ml-2 text-xs text-muted-foreground">{c.accountNumber}</span>}
                    </td>
                    <td className="ws-mono">{c.mobileNumber || c.phone || '-'}</td>
                    <td>
                      {routeName(p.defaultRouteId) ?? <span className="text-xs text-[hsl(var(--ws-returned))]">No route</span>}
                      {p.defaultRouteId && p.routeStopSequence != null && (
                        <span className="ws-mono ml-1.5 text-xs text-muted-foreground">#{p.routeStopSequence}</span>
                      )}
                    </td>
                    <td>{daysLabel(p.deliveryDays)}</td>
                    <td>
                      {factoryName(p.factoryId) ?? <span className="text-xs text-[hsl(var(--ws-returned))]">None</span>}
                      {p.factoryOverridden && (
                        <WholesaleStatusBadge tone="amendment" className="ml-1.5">
                          Override
                        </WholesaleStatusBadge>
                      )}
                    </td>
                    <td>
                      {paymentMethodLabel(p.defaultPaymentMethod)}
                      {p.cashOnly && <span className="ml-1.5 text-xs text-muted-foreground">cash only</span>}
                    </td>
                    <td className="ws-num">{p.allocationPriority ?? '-'}</td>
                    <td>
                      <WholesaleStatusBadge tone={p.active === false ? 'neutral' : 'approved'}>{p.active === false ? 'Paused' : 'Active'}</WholesaleStatusBadge>
                      {c.blocked && (
                        <WholesaleStatusBadge tone="cancelled" className="ml-1.5">
                          Blocked
                        </WholesaleStatusBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No wholesale customers match these filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading wholesale customers...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span className="text-muted-foreground">
            Page {page + 1} of {pages}
          </span>
          <Button variant="outline" className="ws-control" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" className="ws-control" disabled={page + 1 >= pages || loading} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <AddWholesaleCustomerDialog
        open={adding}
        onClose={() => setAdding(false)}
        onPick={customer => {
          setAdding(false);
          setEditing(customer);
        }}
      />

      <CustomerProfileEditor
        customer={editing}
        factories={factories}
        routes={routes}
        readOnly={!canEdit}
        onClose={() => setEditing(null)}
        onSaved={onSaved}
      />
    </WholesalePage>
  );
};

export default WholesaleCustomers;
