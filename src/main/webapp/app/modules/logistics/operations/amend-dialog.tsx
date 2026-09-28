import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { amendFactoryOrder } from './operations.api';
import { IFactoryOrder, IFactoryOrderDetail, IProductCustomers, amendmentChanges, formatQty } from './operations.model';

interface AmendDialogProps {
  open: boolean;
  order: IFactoryOrder;
  products: IProductCustomers[];
  onClose: () => void;
  onDone: (detail: IFactoryOrderDetail) => void;
}

/** Late changes to customer quantities after the factory approved; the factory has to approve the new version. */
export const AmendDialog = ({ open, order, products, onClose, onDone }: AmendDialogProps) => {
  const [edits, setEdits] = useState<Record<string, Record<string, number>>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setEdits({});
      setNote('');
    }
  }, [open]);

  const changes = amendmentChanges(products, edits);

  const save = async () => {
    setBusy(true);
    try {
      const detail = await amendFactoryOrder(order.id, order.version, changes, note.trim());
      toast.success(`Version ${detail.order.version} sent to the factory`);
      onDone(detail);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The amendment could not be sent.'));
    } finally {
      setBusy(false);
    }
  };

  const set = (key: string, orderId: string, value: string) =>
    setEdits(prev => ({ ...prev, [key]: { ...prev[key], [orderId]: value === '' ? undefined : Math.max(0, Number(value)) } }));

  return (
    <Dialog open={open} onOpenChange={value => !value && !busy && onClose()}>
      <WsDialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Amend version {order.version}</DialogTitle>
          <DialogDescription>Change customer quantities. The factory has to approve version {order.version + 1} before production goes on.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {products.map(product => (
            <div key={product.key} className="grid gap-1.5">
              <div className="text-sm font-semibold">
                {product.itemName} <span className="font-normal text-muted-foreground">({formatQty(product.requestedQty)})</span>
              </div>
              {product.customers.map(customer => (
                <label key={customer.orderId} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{customer.customerName}</span>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    className="ws-control w-24"
                    aria-label={`${product.itemName} for ${customer.customerName}`}
                    value={edits[product.key]?.[customer.orderId] ?? customer.quantity}
                    onChange={e => set(product.key, customer.orderId, e.target.value)}
                  />
                </label>
              ))}
            </div>
          ))}
          <Textarea aria-label="Note to the factory" placeholder="Note to the factory (optional)" rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={save} disabled={busy || changes.length === 0}>
            {busy ? 'Sending...' : changes.length ? `Send ${changes.length} ${changes.length === 1 ? 'change' : 'changes'}` : 'No changes'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default AmendDialog;
