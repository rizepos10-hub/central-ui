import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { fetchWholesaleCustomers } from '../customers/wholesale-customer.api';
import { IWholesaleCustomer, IWholesaleRouteDefinition, customerName } from '../customers/wholesale-customer.model';
import { saveClosure } from './closure.api';
import { ACTIONS, ClosureScope, IWholesaleClosure, SCOPES, newClosure, toClosurePayload, validateClosure } from './closure.model';

interface ClosureEditorProps {
  /** The closure to edit, a new one when it has no id, or null when closed. */
  closure: IWholesaleClosure | null;
  factories: IWholesaleFactory[];
  routes: IWholesaleRouteDefinition[];
  customerNames: Record<string, string>;
  onClose: () => void;
  onSaved: (closure: IWholesaleClosure, customerLabel?: string) => void;
}

const Segmented = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) => (
  <div className="inline-flex flex-wrap overflow-hidden rounded-full border bg-card" role="group" aria-label={label}>
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px]', value === option.value && 'bg-accent font-semibold text-accent-foreground')}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const CustomerPicker = ({ value, label, onChange }: { value?: string | null; label?: string; onChange: (customer: IWholesaleCustomer | null) => void }) => {
  const [text, setText] = useState('');
  const [results, setResults] = useState<IWholesaleCustomer[]>([]);

  useEffect(() => {
    if (!text.trim()) {
      setResults([]);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { items } = await fetchWholesaleCustomers({ search: text, page: 0, size: 10 });
        if (!cancelled) setResults(items);
      } catch (error) {
        if (!cancelled) toast.error(wholesaleErrorMessage(error, 'Wholesale customers could not be searched.'));
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  if (value) {
    return (
      <div className="ws-control flex items-center justify-between rounded-md border bg-card px-3 text-[13px]">
        <span className="font-medium">{label || value}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Change customer" onClick={() => onChange(null)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search wholesale customers"
          placeholder="Search wholesale customers"
          className="ws-control pl-8"
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
      {results.length > 0 && (
        <ul className="max-h-40 divide-y overflow-auto rounded-md border">
          {results.map(customer => (
            <li key={customer.id}>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left text-[13px] hover:bg-accent"
                onClick={() => {
                  setText('');
                  onChange(customer);
                }}
              >
                {customerName(customer)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const ClosureEditor = ({ closure, factories, routes, customerNames, onClose, onSaved }: ClosureEditorProps) => {
  const [draft, setDraft] = useState<IWholesaleClosure>(newClosure(''));
  const [customerLabel, setCustomerLabel] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (closure) {
      setDraft({ ...closure });
      setCustomerLabel(closure.scope === 'CUSTOMER' && closure.scopeId ? customerNames[closure.scopeId] : undefined);
      setSubmitted(false);
    }
  }, [closure]);

  const errors = useMemo(() => validateClosure(draft), [draft]);
  const shown = submitted ? errors : {};

  const set = <K extends keyof IWholesaleClosure>(key: K, value: IWholesaleClosure[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  const setScope = (scope: ClosureScope) => {
    setDraft(prev => ({ ...prev, scope, scopeId: null }));
    setCustomerLabel(undefined);
  };

  const setFrom = (fromDate: string) => setDraft(prev => ({ ...prev, fromDate, toDate: !prev.toDate || prev.toDate < fromDate ? fromDate : prev.toDate }));

  const targets = draft.scope === 'FACTORY' ? factories : draft.scope === 'ROUTE' ? routes : [];

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const saved = await saveClosure(toClosurePayload(draft));
      toast.success('Closure saved');
      onSaved(saved, customerLabel);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The closure could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={closure != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft.id ? 'Edit closure' : 'New closure'}</DialogTitle>
          <DialogDescription>Days with no deliveries, for everyone or for one factory, route or customer.</DialogDescription>
        </DialogHeader>

        <fieldset disabled={saving} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Applies to</Label>
            <Segmented label="Applies to" value={draft.scope ?? 'BUSINESS'} options={SCOPES} onChange={setScope} />
            {draft.scope === 'CUSTOMER' && (
              <CustomerPicker
                value={draft.scopeId}
                label={customerLabel}
                onChange={customer => {
                  set('scopeId', customer?.id ?? null);
                  setCustomerLabel(customer ? customerName(customer) : undefined);
                }}
              />
            )}
            {(draft.scope === 'FACTORY' || draft.scope === 'ROUTE') && (
              <Select value={draft.scopeId ?? ''} onValueChange={value => set('scopeId', value)} disabled={saving}>
                <SelectTrigger className="ws-control" aria-label={draft.scope === 'FACTORY' ? 'Closed factory' : 'Closed route'}>
                  <SelectValue placeholder={draft.scope === 'FACTORY' ? 'Choose a factory' : 'Choose a route'} />
                </SelectTrigger>
                <WsSelectContent>
                  {targets.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            )}
            {shown.scopeId && <span className="text-xs text-destructive">{shown.scopeId}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="closure-from">From</Label>
              <Input id="closure-from" type="date" className="ws-control ws-mono" value={draft.fromDate ?? ''} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="closure-to">To</Label>
              <Input
                id="closure-to"
                type="date"
                className="ws-control ws-mono"
                min={draft.fromDate ?? undefined}
                value={draft.toDate ?? ''}
                onChange={e => set('toDate', e.target.value)}
              />
            </div>
          </div>
          {shown.dates && <span className="-mt-2 text-xs text-destructive">{shown.dates}</span>}

          <div className="grid gap-1.5">
            <Label>Deliveries on these days</Label>
            <Segmented label="Deliveries on these days" value={draft.action ?? 'SKIP'} options={ACTIONS} onChange={value => set('action', value)} />
            {draft.action === 'MOVE' ? (
              <div className="grid gap-1">
                <Label htmlFor="closure-move" className="text-xs">
                  Move to
                </Label>
                <Input
                  id="closure-move"
                  type="date"
                  className="ws-control ws-mono w-48"
                  value={draft.moveToDate ?? ''}
                  onChange={e => set('moveToDate', e.target.value)}
                />
                {shown.moveToDate && <span className="text-xs text-destructive">{shown.moveToDate}</span>}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Deliveries that fall on these days don&apos;t happen.</span>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="closure-reason">Reason</Label>
            <Input
              id="closure-reason"
              className="ws-control"
              placeholder="Thanksgiving"
              value={draft.reason ?? ''}
              onChange={e => set('reason', e.target.value)}
            />
          </div>
        </fieldset>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default ClosureEditor;
