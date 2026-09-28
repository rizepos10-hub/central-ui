import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { CustomerNoteDialog } from './customer-note-dialog';
import { CustomerNotesTable } from './customer-notes-table';
import { fetchNotesForCustomer } from './sales.api';
import { ICustomerNote } from './sales.model';

interface CustomerNotesDialogProps {
  /** The customer whose notes are shown; null keeps the dialog closed. */
  customer: { id: string; name: string } | null;
  onClose: () => void;
}

/** Every note about one customer, newest first, with a way to add another. Opened from the customer profile. */
export const CustomerNotesDialog = ({ customer, onClose }: CustomerNotesDialogProps) => {
  const [notes, setNotes] = useState<ICustomerNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;
    setLoading(true);
    fetchNotesForCustomer(customer.id)
      .then(found => !cancelled && setNotes(found))
      .catch(error => !cancelled && toast.error(wholesaleErrorMessage(error, 'The notes could not be loaded.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [customer?.id]);

  return (
    <Dialog open={customer != null} onOpenChange={value => !value && onClose()}>
      <WsDialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Notes about {customer?.name}</DialogTitle>
          <DialogDescription>From order entry, the call list and drivers.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <CustomerNotesTable
            notes={notes}
            loading={loading}
            emptyText="No notes about this customer yet."
            onResolved={saved => setNotes(prev => prev.map(n => (n.id === saved.id ? saved : n)))}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose}>
            Close
          </Button>
          <Button className="ws-control" onClick={() => setAdding(true)}>
            Add note
          </Button>
        </DialogFooter>
        {customer && (
          <CustomerNoteDialog
            open={adding}
            customerId={customer.id}
            customerName={customer.name}
            source="OTHER"
            onClose={() => setAdding(false)}
            onSaved={saved => {
              setAdding(false);
              setNotes(prev => [saved, ...prev]);
            }}
          />
        )}
      </WsDialogContent>
    </Dialog>
  );
};

export default CustomerNotesDialog;
