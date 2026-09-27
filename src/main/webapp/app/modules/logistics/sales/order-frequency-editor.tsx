import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { DAYS, DayOfWeek, IWholesaleCustomer, customerName } from '../customers/wholesale-customer.model';
import { fetchCatalog, fetchOrderFrequencies, saveOrderFrequencies } from './sales.api';
import {
  FREQUENCY_TYPES,
  FrequencyType,
  ICatalogItem,
  IOrderFrequency,
  formatDay,
  nextDueDates,
  toFrequencyPayload,
  todayIso,
  validateFrequency,
} from './sales.model';

interface OrderFrequencyEditorProps {
  /** Null when closed. */
  customer: IWholesaleCustomer | null;
  readOnly: boolean;
  onClose: () => void;
}

const newLine = (): IOrderFrequency => ({ itemId: '', variantId: null, quantity: null, frequencyType: 'DAILY', weekdays: [], active: true });

/** The customer's usual order: what to pre-fill on each delivery, per item and variant. */
export const OrderFrequencyEditor = ({ customer, readOnly, onClose }: OrderFrequencyEditorProps) => {
  const [lines, setLines] = useState<IOrderFrequency[]>([]);
  const [catalog, setCatalog] = useState<ICatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setSubmitted(false);
    setLoading(true);
    Promise.all([fetchOrderFrequencies(customer.id), fetchCatalog().catch(() => [] as ICatalogItem[])])
      .then(([found, items]) => {
        setLines(found);
        setCatalog(items);
      })
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The usual order could not be loaded.')))
      .finally(() => setLoading(false));
  }, [customer]);

  const today = todayIso();
  const errors = useMemo(() => lines.map(validateFrequency), [lines]);
  const disabled = readOnly || saving;

  const update = (index: number, patch: Partial<IOrderFrequency>) => setLines(prev => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const toggleDay = (index: number, day: DayOfWeek) => {
    const days = lines[index].weekdays ?? [];
    update(index, { weekdays: days.includes(day) ? days.filter(d => d !== day) : [...days, day] });
  };

  const itemOf = (itemId: string) => catalog.find(i => i.itemId === itemId);

  const save = async () => {
    setSubmitted(true);
    if (errors.some(Boolean)) return;
    setSaving(true);
    try {
      await saveOrderFrequencies(customer.id, toFrequencyPayload(lines));
      toast.success(`Usual order saved for ${customerName(customer)}`);
      onClose();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The usual order could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={customer != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usual order: {customerName(customer)}</DialogTitle>
          <DialogDescription>
            Pre-filled on Order Entry for each delivery. A line counts for a delivery when one of its days falls since the previous delivery.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading the usual order...</p>
        ) : (
          <div className="grid gap-3">
            {lines.length === 0 && <p className="text-sm text-muted-foreground">No usual order yet.</p>}
            {lines.map((line, index) => {
              const item = itemOf(line.itemId);
              const error = submitted ? errors[index] : undefined;
              const due = validateFrequency(line) ? [] : nextDueDates(line, today);
              return (
                <div key={line.id ?? `new-${index}`} className={cn('ws-card grid gap-2 p-3', line.active === false && 'opacity-60')} data-testid="frequency-line">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={line.itemId || undefined} onValueChange={value => update(index, { itemId: value, variantId: null })} disabled={disabled}>
                      <SelectTrigger className="ws-control w-64" aria-label="Item">
                        <SelectValue placeholder="Item" />
                      </SelectTrigger>
                      <WsSelectContent>
                        {catalog.map(i => (
                          <SelectItem key={i.itemId} value={i.itemId}>
                            {i.name ?? i.itemId}
                          </SelectItem>
                        ))}
                        {line.itemId && !item && <SelectItem value={line.itemId}>{line.itemId}</SelectItem>}
                      </WsSelectContent>
                    </Select>
                    {item && item.variants.length > 1 && (
                      <Select value={line.variantId ?? item.variants[0].id} onValueChange={value => update(index, { variantId: value })} disabled={disabled}>
                        <SelectTrigger className="ws-control w-40" aria-label="Variant">
                          <SelectValue />
                        </SelectTrigger>
                        <WsSelectContent>
                          {item.variants.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name ?? v.id}
                            </SelectItem>
                          ))}
                        </WsSelectContent>
                      </Select>
                    )}
                    <Input
                      aria-label="Quantity"
                      type="number"
                      min={0}
                      step="any"
                      className="ws-control ws-mono w-24"
                      value={line.quantity ?? ''}
                      onChange={e => update(index, { quantity: e.target.value === '' ? null : Number(e.target.value) })}
                      disabled={disabled}
                    />
                    <Select value={line.frequencyType} onValueChange={value => update(index, { frequencyType: value as FrequencyType })} disabled={disabled}>
                      <SelectTrigger className="ws-control w-40" aria-label="How often">
                        <SelectValue />
                      </SelectTrigger>
                      <WsSelectContent>
                        {FREQUENCY_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </WsSelectContent>
                    </Select>
                    {line.frequencyType === 'EVERY_N_DAYS' && (
                      <>
                        <Input
                          aria-label="Every how many days"
                          type="number"
                          min={1}
                          max={365}
                          className="ws-control ws-mono w-20"
                          value={line.intervalDays ?? ''}
                          onChange={e => update(index, { intervalDays: e.target.value === '' ? null : Number(e.target.value) })}
                          disabled={disabled}
                        />
                        <span className="text-xs text-muted-foreground">days from</span>
                        <Input
                          aria-label="First date"
                          type="date"
                          className="ws-control w-40"
                          value={line.anchorDate ?? ''}
                          onChange={e => update(index, { anchorDate: e.target.value })}
                          disabled={disabled}
                        />
                      </>
                    )}
                    <label className="ml-auto flex items-center gap-1.5 text-sm">
                      <Checkbox checked={line.active !== false} onCheckedChange={checked => update(index, { active: checked === true })} disabled={disabled} />
                      Active
                    </label>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove line"
                        onClick={() => setLines(prev => prev.filter((_, i) => i !== index))}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {line.frequencyType === 'WEEKDAYS' && (
                    <div className="flex flex-wrap gap-1" role="group" aria-label="Weekdays">
                      {DAYS.map(day => {
                        const on = line.weekdays?.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            disabled={disabled}
                            aria-pressed={on}
                            onClick={() => toggleDay(index, day.value)}
                            className={cn(
                              'ws-control w-11 rounded-md border text-[13px] disabled:cursor-not-allowed',
                              on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card',
                            )}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="text-muted-foreground">From</span>
                    <Input
                      aria-label="Start date"
                      type="date"
                      className="ws-control w-40"
                      value={line.startDate ?? ''}
                      onChange={e => update(index, { startDate: e.target.value })}
                      disabled={disabled}
                    />
                    <span className="text-muted-foreground">until</span>
                    <Input
                      aria-label="End date"
                      type="date"
                      className="ws-control w-40"
                      value={line.endDate ?? ''}
                      onChange={e => update(index, { endDate: e.target.value })}
                      disabled={disabled}
                    />
                    <Input
                      aria-label="Line note"
                      placeholder="Note for the order line"
                      className="ws-control min-w-[12rem] flex-1"
                      value={line.notes ?? ''}
                      onChange={e => update(index, { notes: e.target.value })}
                      disabled={disabled}
                    />
                  </div>

                  {error ? (
                    <span className="text-xs text-destructive">{error}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {line.active === false
                        ? 'Paused.'
                        : due.length
                        ? `Next due: ${due.map(formatDay).join(', ')}`
                        : validateFrequency(line)
                        ? ''
                        : 'Not due in the next months.'}
                    </span>
                  )}
                </div>
              );
            })}
            {!readOnly && (
              <Button variant="outline" className="ws-control w-fit" onClick={() => setLines(prev => [...prev, newLine()])} disabled={saving}>
                <Plus className="mr-1 h-4 w-4" />
                Add item
              </Button>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button className="ws-control" onClick={save} disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save usual order'}
            </Button>
          )}
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default OrderFrequencyEditor;
