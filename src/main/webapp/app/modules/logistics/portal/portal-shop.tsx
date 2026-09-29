import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff, LogOut, Minus, Plus, Search, ShoppingBasket, Star } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsDialogContent, WsSheetContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { cancelOrder, fetchCatalog, fetchDays, fetchMe, fetchOrders, placeOrder, previewOrder } from './portal.api';
import {
  CLOSED_TEXT,
  Cart,
  IPortalCatalog,
  IPortalDay,
  IPortalItem,
  IPortalMe,
  IPortalOrder,
  IPortalTotals,
  USUAL,
  cartCount,
  cartFromLines,
  cartLines,
  cutoffLabel,
  dayLabel,
  estimateTotal,
  lineKey,
  money,
  sameCart,
  setQuantity,
  variantLabel,
  visibleItems,
} from './portal.model';
import { PortalPassword } from './portal-password';

const Stepper = ({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) => (
  <div className="inline-flex items-center rounded-full border bg-card" role="group" aria-label={`Quantity of ${label}`}>
    <button
      type="button"
      className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent disabled:opacity-40"
      aria-label={`Less ${label}`}
      disabled={disabled || value <= 0}
      onClick={() => onChange(value - 1)}
    >
      <Minus className="h-3.5 w-3.5" />
    </button>
    <input
      aria-label={`${label} quantity`}
      inputMode="numeric"
      className="ws-mono h-8 w-12 bg-transparent text-center text-[13px] outline-none"
      value={value}
      disabled={disabled}
      onChange={e => onChange(Number(e.target.value.replace(/\D/g, '') || 0))}
    />
    <button
      type="button"
      className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent disabled:opacity-40"
      aria-label={`More ${label}`}
      disabled={disabled}
      onClick={() => onChange(value + 1)}
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
);

const ItemCard = ({ item, cart, disabled, onChange }: { item: IPortalItem; cart: Cart; disabled: boolean; onChange: (key: string, value: number) => void }) => (
  <article className="ws-card flex flex-col overflow-hidden" aria-label={item.name}>
    <div className="grid aspect-[4/3] place-items-center bg-muted">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <ImageOff className="h-6 w-6 text-muted-foreground" aria-hidden />
      )}
    </div>
    <div className="grid gap-2 p-3">
      <h3 className="m-0 text-[14px] font-semibold leading-snug">{item.name}</h3>
      {item.variants.map(variant => {
        const key = lineKey(item.itemId, variant.id);
        const label = variantLabel(item, variant);
        return (
          <div key={key} className="flex items-center justify-between gap-2">
            <div className="min-w-0 text-[13px]">
              {label && <div className="truncate text-muted-foreground">{label}</div>}
              <div className="ws-mono font-medium">{variant.price == null ? 'Price on invoice' : money(variant.price)}</div>
            </div>
            <Stepper label={label ? `${item.name} ${label}` : item.name} value={cart[key] ?? 0} disabled={disabled} onChange={value => onChange(key, value)} />
          </div>
        );
      })}
    </div>
  </article>
);

interface BasketProps {
  day: IPortalDay | null;
  cart: Cart;
  catalog: IPortalCatalog | null;
  totals: IPortalTotals | null;
  existing: IPortalOrder | null;
  keptLines: number;
  dirty: boolean;
  saving: boolean;
  onChange: (key: string, value: number) => void;
  onPlace: () => void;
  onReset: () => void;
}

const Basket = ({ day, cart, catalog, totals, existing, keptLines, dirty, saving, onChange, onPlace, onReset }: BasketProps) => {
  const closed = day?.closedReason ?? null;
  const rows = useMemo(() => {
    const names = new Map<string, { name: string; price?: number | null }>();
    catalog?.items.forEach(item =>
      item.variants.forEach(v => {
        const label = variantLabel(item, v);
        names.set(lineKey(item.itemId, v.id), { name: label ? `${item.name} (${label})` : item.name, price: v.price });
      }),
    );
    return Object.entries(cart).map(([key, quantity]) => ({ key, quantity, ...(names.get(key) ?? { name: 'Item' }) }));
  }, [cart, catalog]);
  const estimate = catalog ? estimateTotal(cart, catalog.items) : 0;
  const count = cartCount(cart);

  return (
    <div className="grid gap-3">
      <div>
        <h2 className="m-0 text-sm font-semibold">{existing ? 'Your order' : 'New order'}</h2>
        {day && <div className="text-xs text-muted-foreground">Delivery {dayLabel(day.date)}</div>}
      </div>
      {rows.length === 0 ? (
        <p className="m-0 text-[13px] text-muted-foreground">No items yet.</p>
      ) : (
        <ul className="m-0 grid max-h-[45vh] list-none gap-2 overflow-y-auto p-0">
          {rows.map(row => (
            <li key={row.key} className="flex items-center justify-between gap-2 text-[13px]">
              <div className="min-w-0">
                <div className="truncate">{row.name}</div>
                <div className="ws-mono text-xs text-muted-foreground">{row.price == null ? '' : money(row.price * row.quantity)}</div>
              </div>
              <Stepper label={row.name} value={row.quantity} disabled={!!closed || saving} onChange={value => onChange(row.key, value)} />
            </li>
          ))}
        </ul>
      )}
      {keptLines > 0 && (
        <p className="m-0 text-xs text-muted-foreground">
          {keptLines === 1 ? 'One item your salesman added stays' : `${keptLines} items your salesman added stay`} on the order.
        </p>
      )}
      <div className="grid gap-1 border-t pt-2 text-[13px]">
        <div className="flex justify-between">
          <span>Items</span>
          <span className="ws-mono">{count}</span>
        </div>
        {totals?.tax != null && (
          <div className="flex justify-between text-muted-foreground">
            <span>Tax</span>
            <span className="ws-mono">{money(totals.tax)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="ws-mono">{money(totals?.total ?? estimate)}</span>
        </div>
      </div>
      {closed ? (
        <p role="status" className="m-0 rounded-md bg-muted p-2 text-[13px]">
          {CLOSED_TEXT[closed]}
        </p>
      ) : (
        <div className="grid gap-2">
          <Button className="ws-control" disabled={saving || count === 0 || !dirty} onClick={onPlace}>
            {saving ? 'Saving...' : existing ? 'Update order' : 'Place order'}
          </Button>
          {dirty && (
            <Button variant="ghost" className="ws-control" disabled={saving} onClick={onReset}>
              Undo changes
            </Button>
          )}
          {day?.cutoffAt && <span className="text-center text-xs text-muted-foreground">You can change it until {cutoffLabel(day.cutoffAt)}.</span>}
        </div>
      )}
    </div>
  );
};

/** `/portal`: a wholesale customer orders for a delivery day, like the online shop. */
export const PortalShop = () => {
  const [me, setMe] = useState<IPortalMe | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [days, setDays] = useState<IPortalDay[]>([]);
  const [orders, setOrders] = useState<IPortalOrder[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<IPortalCatalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [category, setCategory] = useState(USUAL);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Cart>({});
  const [baseline, setBaseline] = useState<Cart>({});
  const [totals, setTotals] = useState<IPortalTotals | null>(null);
  const [saving, setSaving] = useState(false);
  const [basketOpen, setBasketOpen] = useState(false);
  const [cancelling, setCancelling] = useState<IPortalOrder | null>(null);

  const loadDays = useCallback(async () => {
    const [nextDays, nextOrders] = await Promise.all([fetchDays(), fetchOrders()]);
    setDays(nextDays);
    setOrders(nextOrders);
    return nextDays;
  }, []);

  const start = useCallback(async () => {
    try {
      const who = await fetchMe();
      setMe(who);
      if (who.mustChangePassword) return;
      const nextDays = await loadDays();
      setDate(current => current ?? (nextDays.find(d => !d.closedReason) ?? nextDays[0])?.date ?? null);
    } catch (error) {
      setLoadError(wholesaleErrorMessage(error, 'Your ordering page could not be loaded.'));
    }
  }, [loadDays]);

  useEffect(() => {
    start();
  }, [start]);

  const day = days.find(d => d.date === date) ?? null;
  const existing = orders.find(o => o.deliveryDate === date) ?? null;

  useEffect(() => {
    if (!date) return;
    let live = true;
    setLoadingCatalog(true);
    setSearch('');
    fetchCatalog(date)
      .then(next => {
        if (!live) return;
        setCatalog(next);
        setCategory(next.usualLines.length > 0 ? USUAL : next.categories[0]?.id ?? USUAL);
      })
      .catch(error => live && toast.error(wholesaleErrorMessage(error, 'The items could not be loaded.')))
      .finally(() => live && setLoadingCatalog(false));
    return () => {
      live = false;
    };
  }, [date]);

  const orderable = useMemo(() => new Set(catalog?.items.map(i => i.itemId) ?? []), [catalog]);
  const keptLines = existing ? existing.lines.filter(l => !orderable.has(l.itemId)).length : 0;
  const existingVersion = existing ? `${existing.id}:${JSON.stringify(existing.lines)}` : '';

  useEffect(() => {
    if (!catalog || catalog.date !== date) return;
    const initial = existing ? cartFromLines(existing.lines.filter(l => orderable.has(l.itemId))) : cartFromLines(catalog.usualLines);
    setCart(initial);
    setBaseline(existing ? initial : {});
  }, [catalog, existingVersion, orderable]);

  useEffect(() => {
    setTotals(null);
    if (!date || day?.closedReason || cartCount(cart) === 0) return;
    const timer = setTimeout(() => {
      previewOrder(date, cartLines(cart))
        .then(setTotals)
        .catch(() => setTotals(null));
    }, 500);
    return () => clearTimeout(timer);
  }, [cart, date, day?.closedReason]);

  const change = (key: string, value: number) => setCart(prev => setQuantity(prev, key, value));
  const dirty = !sameCart(cart, baseline) || (!existing && cartCount(cart) > 0);

  const place = async () => {
    if (!date) return;
    setSaving(true);
    try {
      await placeOrder(date, cartLines(cart));
      toast.success(existing ? 'Your order was updated' : 'Your order was placed');
      setBasketOpen(false);
      await loadDays();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The order could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    setSaving(true);
    try {
      await cancelOrder(cancelling.id);
      toast.success('Your order was cancelled');
      setCancelling(null);
      await loadDays();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The order could not be cancelled.'));
    } finally {
      setSaving(false);
    }
  };

  const items = visibleItems(catalog, category, search);
  const closed = !!day?.closedReason;
  const count = cartCount(cart);
  const categories = [
    ...(catalog?.usualLines.length ? [{ id: USUAL, name: 'Your usual items' }] : []),
    ...(catalog?.categories ?? []),
  ];

  const header = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0">
        <h1 className="m-0 truncate text-lg font-semibold leading-tight">{me?.name ?? 'Ordering'}</h1>
        {me?.deliveryAddress && <div className="truncate text-xs text-muted-foreground">Delivered to {me.deliveryAddress}</div>}
      </div>
      <div className="flex-1" />
      <Link to="/logout" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground">
        <LogOut className="h-4 w-4" /> Sign out
      </Link>
    </div>
  );

  if (loadError) {
    return (
      <WholesalePage>
        {header}
        <p role="alert" className="ws-card m-0 p-4 text-[13px]">
          {loadError}
        </p>
      </WholesalePage>
    );
  }

  if (!me) {
    return (
      <WholesalePage>
        <div className="py-10 text-center text-[13px] text-muted-foreground">Loading...</div>
      </WholesalePage>
    );
  }

  if (me.mustChangePassword) {
    return (
      <WholesalePage>
        {header}
        <PortalPassword name={me.name} onDone={start} />
      </WholesalePage>
    );
  }

  const basket = (
    <Basket
      day={day}
      cart={cart}
      catalog={catalog}
      totals={totals}
      existing={existing}
      keptLines={keptLines}
      dirty={dirty}
      saving={saving}
      onChange={change}
      onPlace={place}
      onReset={() => setCart(existing ? baseline : catalog ? cartFromLines(catalog.usualLines) : {})}
    />
  );

  return (
    <WholesalePage className="pb-20 lg:pb-0">
      {header}

      {!me.orderingReady && (
        <p role="status" className="ws-card m-0 p-3 text-[13px]">
          {CLOSED_TEXT.NOT_SET_UP}
        </p>
      )}

      <div className="grid gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Delivery day">
          {days.length === 0 && <span className="text-[13px] text-muted-foreground">No delivery days in the next four weeks.</span>}
          {days.map(d => (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={d.date === date}
              onClick={() => setDate(d.date)}
              className={cn(
                'grid shrink-0 gap-0.5 rounded-md border px-3 py-1.5 text-left',
                d.date === date ? 'border-primary bg-accent ring-1 ring-primary' : 'bg-card hover:bg-accent/50',
              )}
            >
              <span className="text-[13px] font-medium">{dayLabel(d.date)}</span>
              <span className="text-[11px] text-muted-foreground">
                {d.closedReason ? 'Locked' : d.cutoffAt ? `Order by ${cutoffLabel(d.cutoffAt)}` : 'Open'}
                {d.orderId ? ' · Ordered' : ''}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input aria-label="Search items" placeholder="Search items" className="ws-control pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_300px]">
        <nav aria-label="Categories" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {categories.map(c => (
            <button
              key={c.id}
              type="button"
              aria-pressed={!search && c.id === category}
              onClick={() => {
                setCategory(c.id);
                setSearch('');
              }}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[13px] lg:rounded-md lg:border-transparent',
                !search && c.id === category ? 'border-primary bg-accent font-semibold' : 'bg-card hover:bg-accent/50 lg:bg-transparent',
              )}
            >
              {c.id === USUAL && <Star className="h-3.5 w-3.5" aria-hidden />}
              {c.name}
            </button>
          ))}
        </nav>

        <section aria-label="Items" className="min-w-0">
          {loadingCatalog ? (
            <div className="py-10 text-center text-[13px] text-muted-foreground">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-muted-foreground">{search ? 'No items match your search.' : 'No items here.'}</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map(item => (
                <ItemCard key={item.itemId} item={item} cart={cart} disabled={closed || saving} onChange={change} />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="ws-card sticky top-4 grid gap-4 p-4">
            {basket}
            <UpcomingOrders orders={orders} days={days} onEdit={setDate} onCancel={setCancelling} />
          </div>
        </aside>
      </div>

      <div className="lg:hidden">
        <UpcomingOrders orders={orders} days={days} onEdit={setDate} onCancel={setCancelling} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
        <ShoppingBasket className="h-5 w-5 text-muted-foreground" aria-hidden />
        <div className="text-[13px]">
          <div>{count} items</div>
          <div className="ws-mono font-semibold">{money(totals?.total ?? (catalog ? estimateTotal(cart, catalog.items) : 0))}</div>
        </div>
        <div className="flex-1" />
        <Button className="ws-control" onClick={() => setBasketOpen(true)}>
          {closed ? 'View order' : existing ? 'Review update' : 'Review order'}
        </Button>
      </div>

      <Sheet open={basketOpen} onOpenChange={setBasketOpen}>
        <WsSheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Your basket</SheetTitle>
          </SheetHeader>
          {basket}
        </WsSheetContent>
      </Sheet>

      <Dialog open={cancelling != null} onOpenChange={open => !open && !saving && setCancelling(null)}>
        <WsDialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>{cancelling ? `The order for ${dayLabel(cancelling.deliveryDate)} will be cancelled.` : ''}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="ws-control" disabled={saving} onClick={() => setCancelling(null)}>
              Keep it
            </Button>
            <Button variant="destructive" className="ws-control" disabled={saving} onClick={confirmCancel}>
              {saving ? 'Cancelling...' : 'Cancel order'}
            </Button>
          </DialogFooter>
        </WsDialogContent>
      </Dialog>
    </WholesalePage>
  );
};

const UpcomingOrders = ({
  orders,
  days,
  onEdit,
  onCancel,
}: {
  orders: IPortalOrder[];
  days: IPortalDay[];
  onEdit: (date: string) => void;
  onCancel: (order: IPortalOrder) => void;
}) => (
  <div className="grid gap-2">
    <h2 className="m-0 text-sm font-semibold">Upcoming orders</h2>
    {orders.length === 0 ? (
      <p className="m-0 text-[13px] text-muted-foreground">None yet.</p>
    ) : (
      <ul className="m-0 grid list-none gap-2 p-0">
        {orders.map(order => {
          const open = !order.closedReason && days.some(d => d.date === order.deliveryDate);
          return (
            <li key={order.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2 text-[13px]">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{dayLabel(order.deliveryDate)}</div>
                <div className="ws-mono text-xs text-muted-foreground">
                  {order.lines.length} lines · {money(order.total)}
                </div>
              </div>
              {order.closedReason ? (
                <WholesaleStatusBadge tone="neutral">Locked</WholesaleStatusBadge>
              ) : (
                <WholesaleStatusBadge tone="new">Open</WholesaleStatusBadge>
              )}
              {open && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => onEdit(order.deliveryDate)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onCancel(order)}>
                    Cancel
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default PortalShop;
