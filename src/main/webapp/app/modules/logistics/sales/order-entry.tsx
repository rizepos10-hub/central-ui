import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronRight, Printer, Search, WandSparkles } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchRouteDefinitions, fetchWholesaleCustomer } from '../customers/wholesale-customer.api';
import { IWholesaleCustomer, IWholesaleRouteDefinition, OrderMethod } from '../customers/wholesale-customer.model';
import { CustomerNoteDialog } from './customer-note-dialog';
import { GenerateUsualOrdersDialog } from './generate-usual-orders-dialog';
import { UnfulfilledOrdersDialog } from './unfulfilled-orders-dialog';
import { fetchUnfulfilledOrders } from './order-search.api';
import { IOrderRow, notifyOrdersChanged, ordersLink } from './order-search.model';
import {
  OrderRegister,
  fetchCatalog,
  fetchCreditStatus,
  fetchItemHistory,
  fetchOrderEntryCustomers,
  fetchOrderRegisters,
  fetchSuggestedOrder,
  placeWholesaleOrder,
  saveRouteOverride,
} from './sales.api';
import {
  ICatalogItem,
  ICreditStatus,
  IEntryRow,
  IOrderEntryCustomer,
  addDays,
  buildEntryRows,
  creditWarning,
  formatDay,
  initialQuantities,
  money,
  toPlacementRequest,
  todayIso,
} from './sales.model';

const ALL = '__all';
const REGISTER_KEY = 'wholesale.orderEntry.registerId';

interface Selected {
  customer: IWholesaleCustomer;
  credit: ICreditStatus | null;
  rows: IEntryRow[];
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const printableOrder = (name: string, date: string, lines: { name: string; quantity: number; notes?: string }[], notes: string, orderId?: string) =>
  `<html><head><title>${escapeHtml(name)} ${date}</title><style>body{font-family:sans-serif;font-size:13px}td,th{padding:4px 8px;border-bottom:1px solid #ddd;text-align:left}</style></head><body>` +
  `<h2>${escapeHtml(name)}</h2><p>Delivery ${date}${orderId ? ` / order ${escapeHtml(orderId)}` : ''}</p>` +
  `<table><tr><th>Item</th><th>Qty</th><th>Note</th></tr>${lines
    .map(l => `<tr><td>${escapeHtml(l.name)}</td><td>${l.quantity}</td><td>${escapeHtml(l.notes ?? '')}</td></tr>`)
    .join('')}</table>${notes ? `<p>${escapeHtml(notes)}</p>` : ''}</body></html>`;

const OrderEntry = () => {
  const [searchParams] = useSearchParams();
  const fromCallList = searchParams.get('from') === 'call-list';

  const [date, setDate] = useState(searchParams.get('date') || addDays(todayIso(), 1));
  const [routeId, setRouteId] = useState(ALL);
  const [deliveryDayOnly, setDeliveryDayOnly] = useState(!searchParams.get('customerId'));
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [registers, setRegisters] = useState<OrderRegister[]>([]);
  const [registerId, setRegisterId] = useState<string>(() => localStorage.getItem(REGISTER_KEY) ?? '');
  const [catalog, setCatalog] = useState<ICatalogItem[]>([]);

  const [customers, setCustomers] = useState<IOrderEntryCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('customerId'));
  const [selected, setSelected] = useState<Selected | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [orderMethod, setOrderMethod] = useState<OrderMethod>('Delivery');
  const [showOther, setShowOther] = useState(false);
  const [filter, setFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [unfulfilled, setUnfulfilled] = useState<{ then: 'stay' | 'next' | 'print'; orders: IOrderRow[] } | null>(null);

  useEffect(() => {
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
    fetchCatalog()
      .then(setCatalog)
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The items could not be loaded.')));
    fetchOrderRegisters()
      .then(found => {
        setRegisters(found);
        setRegisterId(current => (found.some(r => r.id === current) ? current : found[0]?.id ?? ''));
      })
      .catch(() => setRegisters([]));
  }, []);

  useEffect(() => {
    if (registerId) localStorage.setItem(REGISTER_KEY, registerId);
  }, [registerId]);

  const latest = useRef(0);
  const loadCustomers = useCallback(async () => {
    const request = ++latest.current;
    setLoadingCustomers(true);
    try {
      const found = await fetchOrderEntryCustomers({ date, routeId: routeId === ALL ? undefined : routeId, deliveryDayOnly });
      if (request === latest.current) setCustomers(found);
    } catch (error) {
      if (request === latest.current) toast.error(wholesaleErrorMessage(error, 'The customers could not be loaded.'));
    } finally {
      if (request === latest.current) setLoadingCustomers(false);
    }
  }, [date, routeId, deliveryDayOnly]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const entry = customers.find(c => c.customerId === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId || catalog.length === 0) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    setLoadingSelected(true);
    Promise.all([
      fetchWholesaleCustomer(selectedId),
      fetchSuggestedOrder(selectedId, date).catch(() => null),
      fetchItemHistory(selectedId).catch(() => []),
      fetchCreditStatus(selectedId).catch(() => null),
    ])
      .then(([customer, suggested, history, credit]) => {
        if (cancelled) return;
        const rows = buildEntryRows(catalog, suggested?.lines ?? [], history);
        setSelected({ customer, credit, rows });
        setQuantities(initialQuantities(rows));
        setItemNotes(Object.fromEntries(rows.filter(r => r.suggested?.notes).map(r => [r.key, r.suggested.notes])));
        setNotes('');
        setShowOther(false);
        setFilter('');
      })
      .catch(error => !cancelled && toast.error(wholesaleErrorMessage(error, 'The customer could not be loaded.')))
      .finally(() => !cancelled && setLoadingSelected(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId, date, catalog]);

  useEffect(() => {
    setOrderMethod(entry?.defaultOrderMethod === 'PickUp' ? 'PickUp' : 'Delivery');
  }, [entry?.customerId]);

  const routeName = (id?: string | null) => (id ? routes.find(r => r.id === id)?.name ?? id : 'No route');
  const register = registers.find(r => r.id === registerId);

  const visibleRows = useMemo(() => {
    const text = filter.trim().toLowerCase();
    return (selected?.rows ?? []).filter(r => !text || r.name.toLowerCase().includes(text) || r.variantName?.toLowerCase().includes(text));
  }, [selected, filter]);

  const totals = useMemo(() => {
    let count = 0;
    let amount = 0;
    (selected?.rows ?? []).forEach(r => {
      const q = quantities[r.key] ?? 0;
      if (q > 0 && r.orderable) {
        count += q;
        amount += q * (r.price ?? 0);
      }
    });
    return { count, amount };
  }, [selected, quantities]);

  const setQuantity = (key: string, value: string) =>
    setQuantities(prev => {
      const next = { ...prev };
      if (value === '' || Number(value) <= 0) delete next[key];
      else next[key] = Number(value);
      return next;
    });

  const changeRoute = async (toRouteId: string) => {
    if (!entry) return;
    try {
      await saveRouteOverride({ customerId: entry.customerId, deliveryDate: date, toRouteId });
      toast.success(toRouteId === entry.defaultRouteId ? 'Back on the usual route' : `On ${routeName(toRouteId)} for ${formatDay(date)}`);
      loadCustomers();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The route could not be changed.'));
    }
  };

  const save = async (then: 'stay' | 'next' | 'print', reviewed = false) => {
    if (!selected || !entry) return;
    if (!register) {
      toast.error('Choose the register the order is placed on.');
      return;
    }
    const request = toPlacementRequest({
      customer: selected.customer,
      entryCustomer: entry,
      branchId: register.branchId,
      tillId: register.tillId,
      deliveryDate: date,
      orderMethod,
      rows: selected.rows,
      quantities,
      itemNotes,
      notes,
      source: fromCallList ? 'CALL_LIST' : 'SALESPERSON',
    });
    if (request.items.length === 0) {
      toast.error('Enter a quantity for at least one item.');
      return;
    }
    setSaving(true);
    if (!reviewed) {
      const open = await fetchUnfulfilledOrders(entry.customerId).catch((): IOrderRow[] => []);
      if (open.length > 0) {
        setSaving(false);
        setUnfulfilled({ then, orders: open });
        return;
      }
    }
    try {
      const order = await placeWholesaleOrder(request);
      toast.success(`Order saved for ${entry.name}`);
      notifyOrdersChanged();
      if (then === 'print') {
        const lines = selected.rows
          .filter(r => request.items.some(i => i.itemId === r.itemId && i.variantId === r.variantId))
          .map(r => ({ name: r.variantName ? `${r.name} (${r.variantName})` : r.name, quantity: quantities[r.key], notes: itemNotes[r.key] }));
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(printableOrder(entry.name, date, lines, notes, order?.id));
          win.document.close();
          win.print();
        }
      }
      await loadCustomers();
      if (then === 'next') {
        const index = customers.findIndex(c => c.customerId === entry.customerId);
        const next = customers.slice(index + 1).find(c => c.orderIds.length === 0) ?? customers[index + 1];
        setSelectedId(next?.customerId ?? null);
      } else {
        setQuantities({});
        setItemNotes({});
        setNotes('');
      }
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The order could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const groups: { key: IEntryRow['group']; title: string }[] = [
    { key: 'usual', title: 'Usual order' },
    { key: 'previous', title: 'Ordered before' },
    { key: 'other', title: 'Other items' },
  ];

  const warning = creditWarning(selected?.credit);

  return (
    <WholesalePage
      title="Order Entry"
      context={`${formatDay(date)} / ${routeId === ALL ? 'all routes' : routeName(routeId)} / ${customers.length} customer${customers.length === 1 ? '' : 's'}`}
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
          <Select value={registerId || undefined} onValueChange={setRegisterId}>
            <SelectTrigger className="ws-control w-52" aria-label="Register">
              <SelectValue placeholder="Register" />
            </SelectTrigger>
            <WsSelectContent>
              {registers.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.branchName} / {r.name}
                </SelectItem>
              ))}
            </WsSelectContent>
          </Select>
          <Button variant="outline" className="ws-control" onClick={() => setGenerateOpen(true)}>
            <WandSparkles className="mr-1 h-4 w-4" />
            Generate usual orders
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <div className="ws-card flex max-h-[75vh] flex-col overflow-hidden">
          <label className="flex items-center gap-2 border-b px-3 py-2 text-[13px]">
            <Checkbox checked={deliveryDayOnly} onCheckedChange={checked => setDeliveryDayOnly(checked === true)} />
            Delivery that day only
          </label>
          <div className="flex-1 overflow-y-auto" role="list" aria-label="Customers">
            {loadingCustomers && <p className="p-3 text-sm text-muted-foreground">Loading customers...</p>}
            {!loadingCustomers && customers.length === 0 && <p className="p-3 text-sm text-muted-foreground">No customers for this date.</p>}
            {!loadingCustomers &&
              customers.map(c => (
                <button
                  key={c.customerId}
                  type="button"
                  role="listitem"
                  onClick={() => setSelectedId(c.customerId)}
                  className={cn(
                    'flex w-full items-center gap-2 border-b px-3 py-2 text-left text-[13px] hover:bg-accent/50',
                    c.customerId === selectedId && 'bg-accent font-semibold',
                  )}
                >
                  <span className="ws-mono w-6 text-xs text-muted-foreground">{c.stopSequence ?? ''}</span>
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.orderIds.length > 0 && <WholesaleStatusBadge tone="approved">Ordered</WholesaleStatusBadge>}
                  {c.autoOrderIds?.length > 0 && <WholesaleStatusBadge tone="new">Usual</WholesaleStatusBadge>}
                  {!c.deliveryDay && <WholesaleStatusBadge tone="amendment">Off day</WholesaleStatusBadge>}
                  {c.overrideId && <WholesaleStatusBadge tone="neutral">Moved</WholesaleStatusBadge>}
                </button>
              ))}
          </div>
        </div>

        <div className="grid content-start gap-3">
          {!selectedId && <div className="ws-card p-6 text-center text-sm text-muted-foreground">Choose a customer to enter their order.</div>}
          {selectedId && (loadingSelected || !selected) && <div className="ws-card p-6 text-center text-sm text-muted-foreground">Loading...</div>}
          {selectedId && selected && !loadingSelected && entry && (
            <>
              <div className="ws-card grid gap-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-lg font-semibold">{entry.name}</h2>
                  {entry.accountNumber && <span className="ws-mono text-xs text-muted-foreground">{entry.accountNumber}</span>}
                  {entry.phone && <span className="ws-mono text-xs text-muted-foreground">{entry.phone}</span>}
                  {entry.cashOnly && <WholesaleStatusBadge tone="amendment">Cash only</WholesaleStatusBadge>}
                  {entry.blocked && <WholesaleStatusBadge tone="cancelled">Blocked</WholesaleStatusBadge>}
                  <div className="flex-1" />
                  <Button variant="outline" className="ws-control" onClick={() => setNoteOpen(true)}>
                    Add note
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="text-muted-foreground">Route on {formatDay(date)}</span>
                  <Select value={entry.routeId ?? undefined} onValueChange={changeRoute}>
                    <SelectTrigger className="ws-control w-48" aria-label="Route for this date">
                      <SelectValue placeholder="No route" />
                    </SelectTrigger>
                    <WsSelectContent>
                      {routes
                        .filter(r => r.active !== false)
                        .map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                            {r.id === entry.defaultRouteId ? ' (usual)' : ''}
                          </SelectItem>
                        ))}
                    </WsSelectContent>
                  </Select>
                  {entry.stopSequence != null && <span className="text-muted-foreground">stop {entry.stopSequence}</span>}
                  {(entry.deliveryWindowStart || entry.deliveryWindowEnd) && (
                    <span className="text-muted-foreground">
                      receives {entry.deliveryWindowStart ?? '?'} to {entry.deliveryWindowEnd ?? '?'}
                    </span>
                  )}
                </div>
                {entry.orderIds.length > 0 && (
                  <p className="m-0 text-[13px]">
                    Already ordered for this date:{' '}
                    {entry.orderIds.map((id, i) => (
                      <React.Fragment key={id}>
                        {i > 0 && ', '}
                        <Link to={ordersLink({ status: 'ALL', customerId: entry.customerId, from: date, to: date })} className="text-primary hover:underline">
                          {id}
                        </Link>
                        {entry.autoOrderIds?.includes(id) && <span className="text-muted-foreground"> (generated from usual order)</span>}
                      </React.Fragment>
                    ))}
                    . Saving adds another order.
                  </p>
                )}
                {!entry.deliveryDay && (
                  <p className="m-0 flex items-center gap-1.5 text-[13px] text-[hsl(var(--ws-returned))]" role="alert">
                    <AlertTriangle className="h-4 w-4" />
                    {formatDay(date)} is not one of this customer&apos;s delivery days. The order will be marked off schedule.
                  </p>
                )}
                {warning && (
                  <p className="m-0 flex items-center gap-1.5 text-[13px] text-[hsl(var(--ws-returned))]" role="alert">
                    <AlertTriangle className="h-4 w-4" />
                    {warning}
                    {(selected.credit?.unpaidOrders ?? 0) > 0 && (
                      <Link to={ordersLink({ status: 'ALL', payment: 'UNPAID', customerId: entry.customerId })} className="ml-1 text-primary hover:underline">
                        View unpaid orders
                      </Link>
                    )}
                  </p>
                )}
              </div>

              <div className="ws-card overflow-hidden">
                <div className="flex items-center gap-2 border-b px-3 py-2">
                  <div className="relative w-64">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input aria-label="Find item" placeholder="Find item" className="ws-control pl-8" value={filter} onChange={e => setFilter(e.target.value)} />
                  </div>
                  <div className="flex-1" />
                  <span className="text-[13px] text-muted-foreground">
                    {totals.count} items / about {money(totals.amount)}
                  </span>
                </div>
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="ws-num">Price</th>
                      <th className="ws-num w-28">Quantity</th>
                      <th>Line note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map(group => {
                      const rows = visibleRows.filter(r => r.group === group.key);
                      if (rows.length === 0) return null;
                      const collapsed = group.key === 'other' && !showOther && !filter.trim();
                      return (
                        <React.Fragment key={group.key}>
                          <tr className="bg-muted/40">
                            <td colSpan={4} className="py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {group.key === 'other' ? (
                                <button type="button" className="inline-flex items-center gap-1" onClick={() => setShowOther(v => !v)}>
                                  {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  {group.title} ({rows.length})
                                </button>
                              ) : (
                                `${group.title} (${rows.length})`
                              )}
                            </td>
                          </tr>
                          {!collapsed &&
                            rows.map(row => (
                              <tr key={row.key} className={cn(!row.orderable && 'opacity-60')}>
                                <td>
                                  <span className="font-medium">{row.name}</span>
                                  {row.variantName && <span className="ml-1.5 text-xs text-muted-foreground">{row.variantName}</span>}
                                  {!row.orderable && <span className="ml-1.5 text-xs text-muted-foreground">(other category)</span>}
                                  {row.history && (
                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                      last {row.history.lastQuantity ?? '-'}
                                      {row.history.lastDeliveryDate ? ` on ${row.history.lastDeliveryDate}` : ''}
                                    </span>
                                  )}
                                </td>
                                <td className="ws-num">{money(row.price)}</td>
                                <td className="ws-num">
                                  <Input
                                    aria-label={`Quantity ${row.name}${row.variantName ? ` ${row.variantName}` : ''}`}
                                    type="number"
                                    min={0}
                                    step="any"
                                    className="ws-control ws-mono w-24 text-right"
                                    placeholder={row.history?.lastQuantity != null ? String(row.history.lastQuantity) : ''}
                                    value={quantities[row.key] ?? ''}
                                    onChange={e => setQuantity(row.key, e.target.value)}
                                    disabled={!row.orderable || saving}
                                  />
                                </td>
                                <td>
                                  <Input
                                    aria-label={`Note ${row.name}`}
                                    className="ws-control"
                                    value={itemNotes[row.key] ?? ''}
                                    onChange={e => setItemNotes(prev => ({ ...prev, [row.key]: e.target.value }))}
                                    disabled={!row.orderable || saving}
                                  />
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="ws-card grid gap-3 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex overflow-hidden rounded-full border bg-card" role="group" aria-label="Delivery or pick up">
                    {(['Delivery', 'PickUp'] as OrderMethod[]).map(method => (
                      <button
                        key={method}
                        type="button"
                        aria-pressed={orderMethod === method}
                        onClick={() => setOrderMethod(method)}
                        className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px]', orderMethod === method && 'bg-accent font-semibold text-accent-foreground')}
                      >
                        {method === 'Delivery' ? 'Delivery' : 'Pick up'}
                      </button>
                    ))}
                  </div>
                  {!register && <span className="text-xs text-destructive">Choose a register above to save orders.</span>}
                </div>
                <Textarea aria-label="Order note" placeholder="Note for the whole order" value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" className="ws-control" onClick={() => save('print')} disabled={saving}>
                    <Printer className="mr-1 h-4 w-4" />
                    Save &amp; Print
                  </Button>
                  <Button variant="outline" className="ws-control" onClick={() => save('stay')} disabled={saving}>
                    Save
                  </Button>
                  <Button className="ws-control" onClick={() => save('next')} disabled={saving}>
                    {saving ? 'Saving...' : 'Save & Next'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <GenerateUsualOrdersDialog
        open={generateOpen}
        date={date}
        routeId={routeId === ALL ? undefined : routeId}
        routeLabel={routeId === ALL ? 'all routes' : routeName(routeId)}
        register={register}
        onClose={() => setGenerateOpen(false)}
        onGenerated={loadCustomers}
      />
      <UnfulfilledOrdersDialog
        customer={unfulfilled && entry ? { id: entry.customerId, name: entry.name } : null}
        orders={unfulfilled?.orders ?? []}
        deliveryDate={date}
        onOrderChanged={row => {
          setUnfulfilled(prev => prev && { ...prev, orders: prev.orders.map(o => (o.id === row.id ? row : o)) });
          loadCustomers();
        }}
        onBack={() => setUnfulfilled(null)}
        onPlace={() => {
          const then = unfulfilled?.then ?? 'stay';
          setUnfulfilled(null);
          save(then, true);
        }}
      />
      {entry && (
        <CustomerNoteDialog
          open={noteOpen}
          customerId={entry.customerId}
          customerName={entry.name}
          source="ORDER_ENTRY"
          onClose={() => setNoteOpen(false)}
          onSaved={() => setNoteOpen(false)}
        />
      )}
    </WholesalePage>
  );
};

export default OrderEntry;
