import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { CancelOrderButton } from './cancel-order-button';
import { IOrderRow, STAGE_LABEL, STAGE_TONE, orderLabel, ordersLink, paymentLabel } from './order-search.model';
import { formatDay, money } from './sales.model';

interface UnfulfilledOrdersDialogProps {
  /** Null when closed. */
  customer: { id: string; name: string } | null;
  orders: IOrderRow[];
  deliveryDate: string;
  onOrderChanged: (row: IOrderRow) => void;
  onBack: () => void;
  onPlace: () => void;
}

/** Shown before a new order is placed when the customer still has orders that are not delivered. */
export const UnfulfilledOrdersDialog = ({ customer, orders, deliveryDate, onOrderChanged, onBack, onPlace }: UnfulfilledOrdersDialogProps) => {
  const open = orders.filter(o => o.stage !== 'CANCELLED');
  const sameDay = open.filter(o => o.deliveryDate === deliveryDate).length;
  return (
    <Dialog open={customer != null} onOpenChange={isOpen => !isOpen && onBack()}>
      <WsDialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer?.name} has {open.length} unfulfilled order{open.length === 1 ? '' : 's'}
          </DialogTitle>
          <DialogDescription>
            {sameDay > 0
              ? `${sameDay} of them ${sameDay === 1 ? 'is' : 'are'} for ${formatDay(deliveryDate)}, the same day as the new order. `
              : ''}
            Cancel the ones that are no longer needed, or keep them and place the new order as well.
          </DialogDescription>
        </DialogHeader>

        <div className="ws-card overflow-hidden">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Items</th>
                <th className="ws-num">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className={order.stage === 'CANCELLED' ? 'opacity-60' : undefined}>
                  <td className="ws-mono">{orderLabel(order)}</td>
                  <td>
                    {order.deliveryDate ? formatDay(order.deliveryDate) : '-'}
                    {order.deliveryDate === deliveryDate && order.stage !== 'CANCELLED' && (
                      <WholesaleStatusBadge tone="returned" className="ml-1.5">
                        Same day
                      </WholesaleStatusBadge>
                    )}
                  </td>
                  <td>
                    <WholesaleStatusBadge tone={STAGE_TONE[order.stage]}>{STAGE_LABEL[order.stage]}</WholesaleStatusBadge>
                    <span className="ml-1.5 text-xs text-muted-foreground">{paymentLabel(order.paymentStatus)}</span>
                  </td>
                  <td className="max-w-[16rem] truncate text-xs" title={order.lines.map(l => `${l.quantity} x ${l.name}`).join(', ')}>
                    {order.lines.map(l => `${l.quantity} x ${l.name}`).join(', ') || '-'}
                  </td>
                  <td className="ws-num">{money(order.total)}</td>
                  <td className="text-right">
                    <CancelOrderButton row={order} onCancelled={onOrderChanged} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="items-center gap-2">
          {customer && (
            <Link to={ordersLink({ customerId: customer.id })} className="mr-auto text-[13px] text-primary hover:underline" onClick={onBack}>
              Open in Orders
            </Link>
          )}
          <Button variant="outline" className="ws-control" onClick={onBack}>
            Back to the order
          </Button>
          <Button className="ws-control" onClick={onPlace}>
            {open.length === 0 ? 'Place the new order' : 'Keep them and place the new order'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default UnfulfilledOrdersDialog;
