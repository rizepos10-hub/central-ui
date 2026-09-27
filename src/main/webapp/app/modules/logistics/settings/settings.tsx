import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchSettings, saveSettings } from './wholesale-settings.api';
import {
  INVOICE_TIMINGS,
  IWholesaleSettings,
  MAX_FOOTER_LENGTH,
  Option,
  PRICE_SOURCES,
  SHORTAGE_ALLOCATIONS,
  addUnique,
  isEmail,
  isTime,
  normalizeEmail,
  sameSettings,
  toSettingsPayload,
  validateSettings,
} from './wholesale-settings.model';

type BooleanKey =
  | 'salesmanCanViewOldOrders'
  | 'allowOverDelivery'
  | 'requireReasonOnQuantityChange'
  | 'escalateToManagerAtCutoff'
  | 'autoDraftFromFrequencyAtCutoff';

const Section = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <section className="ws-card grid gap-4 p-4 md:grid-cols-[260px_1fr]">
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
    <div className="grid content-start gap-4">{children}</div>
  </section>
);

const Chips = ({ values, label, onRemove }: { values: string[]; label: string; onRemove: (value: string) => void }) =>
  values.length === 0 ? null : (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {values.map(value => (
        <li key={value} className="inline-flex items-center gap-1 rounded-full border bg-card py-0.5 pl-2.5 pr-1 text-[13px]">
          <span className="ws-mono">{value}</span>
          <button type="button" aria-label={`Remove ${value}`} className="rounded-full p-0.5 hover:bg-accent" onClick={() => onRemove(value)}>
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );

const Choice = <T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (value: T) => void }) => (
  <div className="grid gap-1.5">
    <Label>{label}</Label>
    <div className="grid gap-1.5 sm:grid-cols-3" role="radiogroup" aria-label={label}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'grid gap-0.5 rounded-md border p-2.5 text-left',
            value === option.value ? 'border-primary bg-accent ring-1 ring-primary' : 'bg-card hover:bg-accent/50',
          )}
        >
          <span className="text-[13px] font-medium">{option.label}</span>
          <span className="text-xs text-muted-foreground">{option.description}</span>
        </button>
      ))}
    </div>
  </div>
);

const WholesaleSettings = () => {
  const [saved, setSaved] = useState<IWholesaleSettings | null>(null);
  const [draft, setDraft] = useState<IWholesaleSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then(settings => {
        setSaved(settings);
        setDraft(settings);
      })
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The wholesale settings could not be loaded.')));
  }, []);

  const errors = useMemo(() => (draft ? validateSettings(draft) : {}), [draft, saved]);
  const shown = submitted ? errors : {};
  const dirty = !sameSettings(draft, saved);

  if (!draft) {
    return (
      <WholesalePage title="Wholesale Settings">
        <div className="py-10 text-center text-[13px] text-muted-foreground">Loading settings...</div>
      </WholesalePage>
    );
  }

  const set = <K extends keyof IWholesaleSettings>(key: K, value: IWholesaleSettings[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  const toggle = (key: BooleanKey, label: string, description: string) => (
    <div className="flex items-start gap-3">
      <Checkbox id={`ws-setting-${key}`} className="mt-0.5" checked={draft[key] === true} onCheckedChange={checked => set(key, checked === true)} />
      <div>
        <Label htmlFor={`ws-setting-${key}`} className="text-[13px] font-medium">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  const percent = (key: 'staleReturnRateAlertPercent' | 'staleCreditPercent', label: string, description: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={`ws-setting-${key}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`ws-setting-${key}`}
          type="number"
          min={0}
          max={100}
          step="0.1"
          className="ws-control ws-mono w-28"
          value={draft[key] ?? ''}
          onChange={e => set(key, e.target.value === '' ? null : Number(e.target.value))}
        />
        <span className="text-muted-foreground">%</span>
      </div>
      <span className={shown[key] ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{shown[key] ?? description}</span>
    </div>
  );

  const addTime = () => {
    if (!isTime(newTime)) return;
    set('reminderTimes', addUnique(draft.reminderTimes, newTime.trim(), true));
    setNewTime('');
  };

  const addEmail = () => {
    if (!newEmail.trim()) return;
    if (!isEmail(newEmail)) {
      setEmailError('Enter a valid email');
      return;
    }
    set('approvalEmailRecipients', addUnique(draft.approvalEmailRecipients, normalizeEmail(newEmail)));
    setNewEmail('');
    setEmailError(null);
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const result = await saveSettings(toSettingsPayload(draft));
      setSaved(result);
      setDraft(result);
      setSubmitted(false);
      toast.success('Wholesale settings saved');
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The wholesale settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const footerLength = (draft.deliveryNoteFooter ?? '').length;

  return (
    <WholesalePage title="Wholesale Settings" context="Rules that apply to every wholesale customer, route and factory">
      <fieldset disabled={saving} className="grid gap-3 pb-16">
        <Section title="Ordering" description="What salesmen and customers can do with an order.">
          {toggle('salesmanCanViewOldOrders', 'Salesmen see past orders', 'Salesmen can open orders from previous delivery days.')}
          {toggle('requireReasonOnQuantityChange', 'Reason for quantity changes', 'A reason is required when a quantity is changed after the order is placed.')}
          {toggle('allowOverDelivery', 'Allow over-delivery', 'Drivers can deliver more than was ordered; each increase needs a reason and raises an alert.')}
        </Section>

        <Section title="Cut-off and reminders" description="Reminders to salespeople, before the factory cut-off, about customers who haven't ordered yet.">
          <div className="grid gap-1.5">
            <Label htmlFor="ws-reminder-time">Reminder times</Label>
            <Chips values={draft.reminderTimes ?? []} label="Saved reminder times" onRemove={value => set('reminderTimes', draft.reminderTimes.filter(t => t !== value))} />
            <div className="flex items-center gap-2">
              <Input
                id="ws-reminder-time"
                type="time"
                className="ws-control ws-mono w-32"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTime()}
              />
              <Button type="button" variant="outline" className="ws-control" disabled={!isTime(newTime)} onClick={addTime}>
                Add time
              </Button>
            </div>
            {(draft.reminderTimes ?? []).length === 0 && <span className="text-xs text-muted-foreground">No reminders.</span>}
          </div>
          {toggle('escalateToManagerAtCutoff', 'Tell the sales manager at cut-off', 'Customers still without an order at the factory cut-off are sent to the sales manager.')}
          {toggle('autoDraftFromFrequencyAtCutoff', 'Draft usual orders at cut-off', "Customers still without an order at the cut-off get a draft from their usual order, for the sales manager to review.")}
        </Section>

        <Section title="Approval emails" description="Who receives the order approval emails.">
          <div className="grid gap-1.5">
            <Label htmlFor="ws-approval-email">Recipients</Label>
            <Chips
              values={draft.approvalEmailRecipients ?? []}
              label="Saved approval email recipients"
              onRemove={value => set('approvalEmailRecipients', draft.approvalEmailRecipients.filter(e => e !== value))}
            />
            <div className="flex items-center gap-2">
              <Input
                id="ws-approval-email"
                type="email"
                className="ws-control w-72"
                placeholder="name@company.com"
                value={newEmail}
                onChange={e => {
                  setNewEmail(e.target.value);
                  setEmailError(null);
                }}
                onKeyDown={e => e.key === 'Enter' && addEmail()}
              />
              <Button type="button" variant="outline" className="ws-control" disabled={!newEmail.trim()} onClick={addEmail}>
                Add
              </Button>
            </div>
            {emailError && <span className="text-xs text-destructive">{emailError}</span>}
          </div>
        </Section>

        <Section title="Stale returns" description="Bread brought back unsold, and how it is credited.">
          <div className="grid gap-4 sm:grid-cols-2">
            {percent('staleReturnRateAlertPercent', 'Alert above return rate', 'Flag customers who return more than this share of what was delivered. Leave empty for no alert.')}
            {percent('staleCreditPercent', 'Credit', 'Share of the price credited for stale returns.')}
          </div>
          <Choice label="Credit at" value={draft.staleCreditPriceSource ?? 'SOURCE_ORDER_PRICE'} options={PRICE_SOURCES} onChange={value => set('staleCreditPriceSource', value)} />
        </Section>

        <Section title="Invoices and shortages" description="When invoices are issued, and how a short factory run is split.">
          <Choice label="Issue invoices" value={draft.invoiceTiming ?? 'ON_DELIVERY'} options={INVOICE_TIMINGS} onChange={value => set('invoiceTiming', value)} />
          <Choice
            label="When a factory is short"
            value={draft.defaultShortageAllocation ?? 'PROPORTIONAL'}
            options={SHORTAGE_ALLOCATIONS}
            onChange={value => set('defaultShortageAllocation', value)}
          />
        </Section>

        <Section title="Delivery note" description="Printed at the bottom of every delivery note.">
          <div className="grid gap-1.5">
            <Label htmlFor="ws-delivery-footer">Footer</Label>
            <Textarea
              id="ws-delivery-footer"
              rows={3}
              value={draft.deliveryNoteFooter ?? ''}
              onChange={e => set('deliveryNoteFooter', e.target.value)}
            />
            <span className={cn('text-right text-xs', footerLength > MAX_FOOTER_LENGTH ? 'text-destructive' : 'text-muted-foreground')}>
              {shown.deliveryNoteFooter ?? `${footerLength} / ${MAX_FOOTER_LENGTH}`}
            </span>
          </div>
        </Section>
      </fieldset>

      {dirty && (
        <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-2 rounded-md border bg-background/95 px-4 py-2 shadow-sm backdrop-blur">
          <span className="mr-auto text-[13px] text-muted-foreground">You have unsaved changes.</span>
          <Button
            variant="ghost"
            className="ws-control"
            disabled={saving}
            onClick={() => {
              setDraft(saved);
              setSubmitted(false);
            }}
          >
            Discard
          </Button>
          <Button className="ws-control" disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      )}
    </WholesalePage>
  );
};

export default WholesaleSettings;
