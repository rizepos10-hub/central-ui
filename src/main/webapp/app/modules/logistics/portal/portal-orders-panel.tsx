import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { fetchPortalFeed } from './portal.api';
import { IPortalFeedOrder, dayLabel, money } from './portal.model';

const when = (value?: string | null) => (value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');

/** Orders customers placed or changed themselves on the portal in the last week; hidden when the feed can't be read. */
export const PortalOrdersPanel = () => {
  const [orders, setOrders] = useState<IPortalFeedOrder[] | null>(null);

  useEffect(() => {
    let live = true;
    fetchPortalFeed(7)
      .then(result => live && setOrders(result))
      .catch(() => live && setOrders(null));
    return () => {
      live = false;
    };
  }, []);

  if (orders == null) return null;

  return (
    <section aria-label="Portal orders" className="theme-wholesale ws-card grid gap-2 p-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="m-0 text-sm font-semibold">Orders from the customer portal</h2>
        <span className="text-xs text-muted-foreground">last 7 days</span>
      </div>
      {orders.length === 0 ? (
        <p className="m-0 text-[13px] text-muted-foreground">No customer placed or changed an order on the portal.</p>
      ) : (
        <ul className="m-0 grid max-h-72 list-none gap-1.5 overflow-y-auto p-0">
          {orders.map(order => {
            const changed = order.updatedAt && order.placedAt && order.updatedAt !== order.placedAt;
            return (
              <li key={order.orderId} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 text-[13px]">
                <span className="min-w-0 flex-1 font-medium">{order.customerName}</span>
                <span>Delivery {dayLabel(order.deliveryDate)}</span>
                <span className="ws-mono text-muted-foreground">
                  {order.lineCount} lines · {money(order.total)}
                </span>
                <WholesaleStatusBadge status={order.status} />
                <span className="text-xs text-muted-foreground">
                  {changed ? 'Changed' : 'Placed'} {when(order.updatedAt ?? order.placedAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default PortalOrdersPanel;
