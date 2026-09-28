import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { allocateShortages } from './operations.api';
import {
  ALLOCATION_METHODS,
  AllocationMethod,
  IAllocationResult,
  IFactoryOrder,
  IProductCustomers,
  IShortageChoice,
  ShortageOption,
  formatQty,
  isShort,
  lineKey,
  shortageReasonLabel,
  toAllocation,
} from './operations.model';

interface AllocationPanelProps {
  order: IFactoryOrder;
  products: IProductCustomers[];
  factories: IWholesaleFactory[];
  defaultMethod?: AllocationMethod | null;
  onDone: (result: IAllocationResult) => void;
}

const OPTIONS: { value: ShortageOption; label: string }[] = [
  ...ALLOCATION_METHODS.map(m => ({ value: m.value as ShortageOption, label: m.label })),
  { value: 'MOVE', label: 'Order it from another factory' },
  { value: 'SUBSTITUTE', label: 'Replace with another product' },
];

/** How to cover each short product on a returned order, then re-submit the next version to the factory. */
export const AllocationPanel = ({ order, products, factories, defaultMethod, onDone }: AllocationPanelProps) => {
  const shortLines = useMemo(() => order.lines.filter(line => isShort(line) && !line.transferredFromFactoryId), [order]);
  const byKey = useMemo(() => Object.fromEntries(products.map(p => [p.key, p])), [products]);
  const [choiceState, setChoiceState] = useState<{ version: number; values: Record<string, IShortageChoice> }>({ version: -1, values: {} });
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSubmitted(false);
  }, [order.version]);

  const choices = choiceState.version === order.version ? choiceState.values : {};
  const fallback: IShortageChoice = { option: defaultMethod ?? 'PROPORTIONAL' };
  const choiceFor = (key: string) => choices[key] ?? fallback;

  const results = shortLines.map(line => ({ line, ...toAllocation(line, choiceFor(lineKey(line)), byKey[lineKey(line)]) }));
  const otherFactories = factories.filter(f => f.id !== order.factoryId && f.active !== false);
  const substitutes = order.lines.filter(l => !l.transferredFromFactoryId);

  const update = (key: string, patch: Partial<IShortageChoice>) =>
    setChoiceState(prev => {
      const values = prev.version === order.version ? prev.values : {};
      return { version: order.version, values: { ...values, [key]: { ...(values[key] ?? fallback), ...patch } } };
    });

  const submit = async () => {
    setSubmitted(true);
    if (results.some(r => r.error)) return;
    setBusy(true);
    try {
      const result = await allocateShortages(
        order.id,
        order.version,
        results.map(r => r.allocation),
        note.trim(),
      );
      toast.success(`Version ${result.factoryOrder.order.version} sent to the factory`);
      onDone(result);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The shortages could not be allocated.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ws-card grid gap-4 p-4" data-testid="allocation-panel">
      <div>
        <h2 className="m-0 text-base font-semibold">Cover the shortages</h2>
        <p className="m-0 text-sm text-muted-foreground">
          The factory can supply less than ordered. Choose how to cover each product; the customer orders change and version {order.version + 1} goes to the
          factory.
        </p>
      </div>
      {results.map(({ line, error }) => {
        const key = lineKey(line);
        const choice = choiceFor(key);
        const product = byKey[key];
        return (
          <div key={key} className="grid gap-2 border-t pt-3" data-testid={`shortage-${key}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{line.itemName}</span>
              <span className="text-sm text-muted-foreground">
                {formatQty(line.availableQty)} of {formatQty(line.requestedQty)} available, {formatQty((line.requestedQty ?? 0) - (line.availableQty ?? 0))} short
                {line.shortageReason && ` (${shortageReasonLabel(line.shortageReason)})`}
              </span>
              <div className="flex-1" />
              <Select value={choice.option} onValueChange={value => update(key, { option: value as ShortageOption })}>
                <SelectTrigger className="ws-control w-64" aria-label={`How to cover ${line.itemName}`}>
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  {OPTIONS.filter(o => o.value !== 'MOVE' || otherFactories.length > 0).map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            </div>
            {choice.option === 'MOVE' && (
              <Select value={choice.moveToFactoryId} onValueChange={value => update(key, { moveToFactoryId: value })}>
                <SelectTrigger className="ws-control w-64" aria-label={`Factory for ${line.itemName}`}>
                  <SelectValue placeholder="Choose the factory" />
                </SelectTrigger>
                <WsSelectContent>
                  {otherFactories.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            )}
            {choice.option === 'SUBSTITUTE' && (
              <Select value={choice.substituteKey} onValueChange={value => update(key, { substituteKey: value })}>
                <SelectTrigger className="ws-control w-64" aria-label={`Replacement for ${line.itemName}`}>
                  <SelectValue placeholder="Choose the replacement" />
                </SelectTrigger>
                <WsSelectContent>
                  {substitutes
                    .filter(l => lineKey(l) !== key)
                    .map(l => (
                      <SelectItem key={lineKey(l)} value={lineKey(l)}>
                        {l.itemName}
                      </SelectItem>
                    ))}
                </WsSelectContent>
              </Select>
            )}
            {choice.option === 'MANUAL' && product && (
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {product.customers.map(customer => (
                  <label key={customer.orderId} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {customer.customerName} <span className="text-muted-foreground">({formatQty(customer.quantity)})</span>
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={customer.quantity}
                      step="any"
                      className="ws-control w-24"
                      aria-label={`${customer.customerName} gets`}
                      value={choice.manual?.[customer.orderId] ?? ''}
                      onChange={e =>
                        update(key, { manual: { ...choice.manual, [customer.orderId]: e.target.value === '' ? undefined : Number(e.target.value) } })
                      }
                    />
                  </label>
                ))}
              </div>
            )}
            {submitted && error && <span className="text-xs text-destructive">{error}</span>}
          </div>
        );
      })}
      <Textarea aria-label="Note to the factory" placeholder="Note to the factory (optional)" rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} />
      <div className="flex justify-end">
        <Button className="ws-control" onClick={submit} disabled={busy || shortLines.length === 0}>
          {busy ? 'Sending...' : `Allocate and send version ${order.version + 1}`}
        </Button>
      </div>
    </div>
  );
};

export default AllocationPanel;
