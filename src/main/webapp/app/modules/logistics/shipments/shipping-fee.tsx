import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { money } from '../sales/sales.model';
import { requoteShipping, setShippingFee } from '../shipping/shipping.api';
import { IShippingQuote, SOURCE_LABEL, ShippingProvider, quoteSource } from '../shipping/shipping.model';
import { cn } from '@/src/main/webapp/app/lib/utils';
import { IShipmentRow } from './shipments.model';

/** Fee charged for the order and where it came from. */
export const ShippingCell = ({ quote }: { quote?: IShippingQuote | null }) => {
  if (!quote) return <span className="text-muted-foreground">-</span>;
  const source = quoteSource(quote);
  return (
    <div>
      <div className="ws-mono">{quote.chargedFee != null ? money(quote.chargedFee) : '-'}</div>
      <div className="text-xs text-muted-foreground">
        {quote.overrideFee != null ? 'Set by hand' : source}
        {quote.pending && ' (getting live rates)'}
      </div>
      {quote.error && (
        <div className="max-w-[16rem] truncate text-xs text-amber-700" title={quote.error}>
          {quote.error}
        </div>
      )}
    </div>
  );
};

/** In the ship dialog: buy the label from the provider that quoted the order, or type the tracking number. */
export const LabelChoice = ({
  provider,
  quote,
  buyLabel,
  onChange,
}: {
  provider: ShippingProvider;
  quote?: IShippingQuote | null;
  buyLabel: boolean;
  onChange: (buyLabel: boolean) => void;
}) => {
  const service = [quote?.carrier, quote?.service].filter(Boolean).join(' ');
  const options = [
    {
      value: true,
      label: `Buy the label with ${SOURCE_LABEL[provider]}`,
      description: `${service || 'The quoted service'}. The carrier and tracking number are filled in.`,
    },
    { value: false, label: 'Enter a tracking number', description: 'The label was made somewhere else.' },
  ];
  return (
    <div className="grid gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label="Label">
      {options.map(option => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={buyLabel === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'grid gap-0.5 rounded-md border p-2.5 text-left',
            buyLabel === option.value ? 'border-primary bg-accent ring-1 ring-primary' : 'bg-card hover:bg-accent/50',
          )}
        >
          <span className="text-[13px] font-medium">{option.label}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  );
};

export const FeeDialog = ({ row, onClose, onSaved }: { row: IShipmentRow | null; onClose: () => void; onSaved: () => void }) => {
  const [quote, setQuote] = useState<IShippingQuote | null>(null);
  const [fee, setFee] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (row) {
      setQuote(row.shipping ?? null);
      setFee(row.shipping?.overrideFee != null ? String(row.shipping.overrideFee) : '');
      setError(null);
    }
  }, [row]);

  const run = async (action: () => Promise<IShippingQuote>, message: string) => {
    setBusy(true);
    try {
      const next = await action();
      setQuote(next);
      toast.success(message);
      onSaved();
    } catch (e) {
      toast.error(wholesaleErrorMessage(e, 'The shipping fee could not be changed.'));
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const value = fee.trim() === '' ? null : Number(fee);
    if (value != null && (Number.isNaN(value) || value < 0)) {
      setError('Enter a fee of 0 or more');
      return;
    }
    setError(null);
    run(() => setShippingFee(row.orderId, value), value == null ? 'The quoted fee is charged again' : 'Shipping fee saved');
  };

  const source = quoteSource(quote);

  return (
    <Dialog open={row != null} onOpenChange={open => !open && !busy && onClose()}>
      <WsDialogContent>
        <DialogHeader>
          <DialogTitle>Shipping fee for order {row?.sequenceNumber ?? ''}</DialogTitle>
          <DialogDescription>{row?.customerName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-[13px]">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Quote</dt>
            <dd>{quote?.fee != null ? `${money(quote.fee)}${source ? ` (${source})` : ''}` : 'No quote yet'}</dd>
            {quote?.cost != null && (
              <>
                <dt className="text-muted-foreground">Carrier cost</dt>
                <dd>{money(quote.cost)}</dd>
              </>
            )}
            {quote?.weightKg != null && (
              <>
                <dt className="text-muted-foreground">Weight</dt>
                <dd>
                  {quote.weightKg} kg {quote.packaging === 'PALLET' ? 'on a pallet' : 'in a parcel'}
                </dd>
              </>
            )}
            {quote?.transitDays != null && (
              <>
                <dt className="text-muted-foreground">Transit</dt>
                <dd>
                  {quote.transitDays} day{quote.transitDays === 1 ? '' : 's'}
                </dd>
              </>
            )}
          </dl>
          {quote?.error && <p className="text-xs text-amber-700">{quote.error}</p>}
          <div className="grid gap-1.5">
            <Label htmlFor="ws-shipping-fee">Fee to charge</Label>
            <Input
              id="ws-shipping-fee"
              type="number"
              min={0}
              step="0.01"
              className="ws-control ws-mono w-36"
              placeholder={quote?.fee != null ? String(quote.fee) : ''}
              value={fee}
              disabled={busy}
              onChange={e => setFee(e.target.value)}
            />
            <span className={error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {error ?? 'Leave empty to charge the quote.'}
            </span>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="ws-control mr-auto"
            disabled={busy}
            onClick={() => run(() => requoteShipping(row.orderId), 'Shipping quoted again')}
          >
            Get a new quote
          </Button>
          <Button variant="ghost" className="ws-control" onClick={onClose} disabled={busy}>
            Close
          </Button>
          <Button className="ws-control" onClick={save} disabled={busy}>
            {busy ? 'Working...' : 'Save fee'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};
