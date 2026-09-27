import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';

import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchWholesaleCustomer, searchRetailCustomers } from './wholesale-customer.api';
import { IWholesaleCustomer, customerName } from './wholesale-customer.model';

interface AddWholesaleCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the full customer, including its profile when it is already a wholesale customer. */
  onPick: (customer: IWholesaleCustomer) => void;
}

export const AddWholesaleCustomerDialog = ({ open, onClose, onPick }: AddWholesaleCustomerDialogProps) => {
  const [text, setText] = useState('');
  const [results, setResults] = useState<IWholesaleCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setText('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!text.trim()) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchRetailCustomers(text);
        if (!cancelled) setResults(found);
      } catch (error) {
        if (!cancelled) toast.error(wholesaleErrorMessage(error, 'Customers could not be searched.'));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  const pick = async (customer: IWholesaleCustomer) => {
    setPicking(customer.id);
    try {
      onPick(await fetchWholesaleCustomer(customer.id));
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The customer could not be loaded.'));
    } finally {
      setPicking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <WsDialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add wholesale customer</DialogTitle>
          <DialogDescription>Find an existing customer. New customers are created on the Customers page first.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            aria-label="Search customers"
            placeholder="Name or business name"
            className="ws-control pl-8"
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>
        <ul className="max-h-[320px] divide-y overflow-auto rounded-md border" aria-label="Customers found">
          {results.map(customer => (
            <li key={customer.id}>
              <button
                type="button"
                disabled={picking != null}
                onClick={() => pick(customer)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-accent disabled:opacity-60"
              >
                <span>
                  <span className="font-medium">{customerName(customer)}</span>
                  {customer.businessName && customer.firstName && (
                    <span className="ml-2 text-muted-foreground">{[customer.firstName, customer.lastName].filter(Boolean).join(' ')}</span>
                  )}
                </span>
                <span className="ws-mono text-xs text-muted-foreground">
                  {picking === customer.id ? 'Opening...' : customer.accountNumber || customer.mobileNumber || customer.phone || ''}
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">
              {searching ? 'Searching...' : text.trim() ? 'No customers found.' : 'Type to search.'}
            </li>
          )}
        </ul>
      </WsDialogContent>
    </Dialog>
  );
};

export default AddWholesaleCustomerDialog;
