import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-toastify';

import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchWholesaleCustomers } from '../customers/wholesale-customer.api';
import { IWholesaleCustomer, customerName } from '../customers/wholesale-customer.model';
import { IRouteDefinition } from './route-definition.model';

interface AddStopDialogProps {
  route: IRouteDefinition | null;
  routes: IRouteDefinition[];
  onClose: () => void;
  onPick: (customer: IWholesaleCustomer) => Promise<void>;
}

export const AddStopDialog = ({ route, routes, onClose, onPick }: AddStopDialogProps) => {
  const [text, setText] = useState('');
  const [results, setResults] = useState<IWholesaleCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!route) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { items } = await fetchWholesaleCustomers({ search: text, page: 0, size: 20 });
        if (!cancelled) setResults(items);
      } catch (error) {
        if (!cancelled) toast.error(wholesaleErrorMessage(error, 'Wholesale customers could not be searched.'));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [route, text]);

  useEffect(() => {
    if (!route) {
      setText('');
      setResults([]);
    }
  }, [route]);

  const pick = async (customer: IWholesaleCustomer) => {
    setAdding(customer.id);
    try {
      await onPick(customer);
    } finally {
      setAdding(null);
    }
  };

  const routeName = (id?: string | null) => routes.find(r => r.id === id)?.name ?? 'another route';

  return (
    <Dialog open={route != null} onOpenChange={open => !open && adding == null && onClose()}>
      <WsDialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a stop to {route?.name}</DialogTitle>
          <DialogDescription>The customer is added as the last stop. A customer on another route moves to this one.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            aria-label="Search wholesale customers"
            placeholder="Name, phone, email, account"
            className="ws-control pl-8"
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </div>
        <ul className="max-h-[320px] divide-y overflow-auto rounded-md border" aria-label="Wholesale customers found">
          {results.map(customer => {
            const current = customer.wholesaleProfile?.defaultRouteId;
            const onThisRoute = current === route?.id;
            return (
              <li key={customer.id}>
                <button
                  type="button"
                  disabled={onThisRoute || adding != null}
                  onClick={() => pick(customer)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="font-medium">{customerName(customer)}</span>
                  <span className="text-xs text-muted-foreground">
                    {adding === customer.id ? 'Adding...' : onThisRoute ? 'Already on this route' : current ? `Moves from ${routeName(current)}` : 'No route'}
                  </span>
                </button>
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-[13px] text-muted-foreground">{searching ? 'Searching...' : 'No wholesale customers found.'}</li>
          )}
        </ul>
      </WsDialogContent>
    </Dialog>
  );
};

export default AddStopDialog;
