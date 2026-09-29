import React, { useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';

import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { cancelOrder } from './order-search.api';
import { IOrderRow, notifyOrdersChanged, orderLabel } from './order-search.model';

interface CancelOrderButtonProps {
  row: IOrderRow;
  onCancelled: (row: IOrderRow) => void;
}

/** Cancels an order after a second click; explains why when the order can no longer be cancelled here. */
export const CancelOrderButton = ({ row, onCancelled }: CancelOrderButtonProps) => {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (row.stage === 'CANCELLED') return null;
  if (!row.cancellable) {
    return <span className="text-xs text-muted-foreground">{row.cancelBlockedReason}</span>;
  }

  const cancel = async () => {
    setBusy(true);
    try {
      const updated = await cancelOrder(row.id);
      toast.success(`Order ${orderLabel(row)} cancelled`);
      notifyOrdersChanged();
      onCancelled(updated);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The order could not be cancelled.'));
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" className="ws-control" onClick={() => setConfirming(true)}>
        Cancel order
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs">Cancel {orderLabel(row)}?</span>
      <Button variant="destructive" size="sm" className="ws-control" onClick={cancel} disabled={busy}>
        {busy ? 'Cancelling...' : 'Yes, cancel'}
      </Button>
      <Button variant="outline" size="sm" className="ws-control" onClick={() => setConfirming(false)} disabled={busy}>
        Keep
      </Button>
    </span>
  );
};

export default CancelOrderButton;
