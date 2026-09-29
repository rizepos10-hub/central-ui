import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { fetchSettings } from '../settings/wholesale-settings.api';
import { formatDay } from '../closures/closure.model';
import { fetchFactoryOrder, fetchFactoryOrderCustomers } from './operations.api';
import {
  AMENDABLE,
  AllocationMethod,
  FACTORY_ORDER_STATUS_LABEL,
  IAffectedCustomer,
  IFactoryOrderDetail,
  INVOICEABLE,
  IProductCustomers,
  carrierLabel,
  factoryOrderTone,
  formatQty,
  formatTime,
} from './operations.model';
import { FactoryOrderLines } from './factory-order-lines';
import { FactoryOrderHistory } from './factory-order-history';
import { AllocationPanel } from './allocation-panel';
import { AmendDialog } from './amend-dialog';
import { InvoicesPanel } from './invoices-panel';
import { SENDER_ROLES } from './factory-orders';
import { useFactoryUpdates } from './factory-socket';

const INVOICE_ROLES = [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_BOOKKEEPER];

/** One factory order: its lines, what the factory answered, shortage allocation, amendments, history and invoices. */
const FactoryOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canSend = hasAnyAuthority(authorities, SENDER_ROLES);
  const canIssue = hasAnyAuthority(authorities, INVOICE_ROLES);

  const [detail, setDetail] = useState<IFactoryOrderDetail | null>(null);
  const [products, setProducts] = useState<IProductCustomers[]>([]);
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<AllocationMethod | null>(null);
  const [affected, setAffected] = useState<IAffectedCustomer[]>([]);
  const [amending, setAmending] = useState(false);

  const load = useCallback(async () => {
    try {
      setDetail(await fetchFactoryOrder(id));
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The factory order could not be loaded.'));
    }
  }, [id]);

  useEffect(() => {
    setDetail(null);
    load();
    fetchFactories()
      .then(setFactories)
      .catch(() => setFactories([]));
    fetchSettings()
      .then(settings => setDefaultMethod(settings.defaultShortageAllocation ?? null))
      .catch(() => setDefaultMethod(null));
  }, [load]);

  const order = detail?.order;
  const needsCustomers = canSend && order != null && (order.status === 'RETURNED' || AMENDABLE.includes(order.status));

  useEffect(() => {
    if (!needsCustomers) return;
    fetchFactoryOrderCustomers(order.id)
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [needsCustomers, order?.id, order?.version]);

  useFactoryUpdates(order ? [order.factoryId] : [], event => {
    if (!event || event.id === id) load();
  });

  const factoryNames = useMemo(() => Object.fromEntries(factories.map(f => [f.id, f.name])), [factories]);
  const customerNames = useMemo(
    () => Object.fromEntries(products.flatMap(p => p.customers.map(c => [c.orderId, c.customerName ?? '']))),
    [products],
  );

  if (!order) {
    return (
      <WholesalePage title="Factory order">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </WholesalePage>
    );
  }

  const context = [
    `Deliveries on ${formatDay(order.deliveryDate)}`,
    order.sentAt && `sent ${formatTime(order.sentAt)} by ${order.sentBy}`,
    order.approvedAt && order.status !== 'SENT' && order.status !== 'RETURNED' && `approved ${formatTime(order.approvedAt)} by ${order.approvedBy}`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <WholesalePage
      title={
        <span className="inline-flex flex-wrap items-center gap-2">
          <Link to="/logistics/factory-orders" aria-label="Back to Factory Orders" className="text-muted-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {detail.factoryName ?? 'Factory order'}
          <span className="text-base font-normal text-muted-foreground">v{order.version}</span>
          {carrierLabel(order.carrierKey) && <WholesaleStatusBadge tone="new">{carrierLabel(order.carrierKey)}</WholesaleStatusBadge>}
          <WholesaleStatusBadge tone={factoryOrderTone(order.status)}>{FACTORY_ORDER_STATUS_LABEL[order.status]}</WholesaleStatusBadge>
        </span>
      }
      context={context}
      actions={
        canSend &&
        AMENDABLE.includes(order.status) && (
          <Button variant="outline" className="ws-control" onClick={() => setAmending(true)} disabled={products.length === 0}>
            Amend
          </Button>
        )
      }
    >
      {order.status === 'RETURNED' && order.returnNote && (
        <div className="ws-card border-l-4 border-l-[hsl(var(--ws-returned))] px-4 py-2 text-sm">
          <span className="font-semibold">Factory note: </span>
          {order.returnNote}
        </div>
      )}

      <FactoryOrderLines order={order} routeNames={detail.routeNames} factoryNames={factoryNames} />

      {order.status === 'RETURNED' && canSend && (
        <AllocationPanel
          order={order}
          products={products}
          factories={factories}
          defaultMethod={defaultMethod}
          onDone={result => {
            setDetail(result.factoryOrder);
            setAffected(result.affected);
          }}
        />
      )}

      {affected.length > 0 && (
        <div className="ws-card p-4" data-testid="affected-customers">
          <h2 className="m-0 mb-2 text-base font-semibold">Customers whose orders changed</h2>
          <ul className="m-0 grid gap-1 pl-4 text-sm">
            {affected.map((a, i) => (
              <li key={`${a.orderId}-${i}`}>
                {a.customerName}: {a.itemName} {formatQty(a.fromQty)} to {formatQty(a.toQty)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {INVOICEABLE.includes(order.status) && (canIssue || canSend) && (
        <InvoicesPanel factoryOrderId={order.id} routeNames={detail.routeNames} canIssue={canIssue} />
      )}

      <div className="ws-card p-4">
        <h2 className="m-0 mb-3 text-base font-semibold">History</h2>
        <FactoryOrderHistory history={order.history ?? []} customerNames={customerNames} />
      </div>

      {canSend && AMENDABLE.includes(order.status) && (
        <AmendDialog
          open={amending}
          order={order}
          products={products}
          onClose={() => setAmending(false)}
          onDone={updated => {
            setAmending(false);
            setDetail(updated);
          }}
        />
      )}
    </WholesalePage>
  );
};

export default FactoryOrderDetail;
