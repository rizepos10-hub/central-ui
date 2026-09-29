import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { OrderFrequencyEditor } from '../sales/order-frequency-editor';
import { CustomerNotesDialog } from '../sales/customer-notes-dialog';
import { PortalAccessDialog } from '../portal/portal-access-dialog';
import { saveWholesaleProfile } from './wholesale-customer.api';
import { CarrierCustomerFields } from './carrier-customer-fields';
import {
  DAYS,
  DayOfWeek,
  ICustomerWholesaleProfile,
  IWholesaleCustomer,
  IWholesaleRouteDefinition,
  ORDER_METHODS,
  OrderMethod,
  PAYMENT_METHODS,
  WholesalePaymentMethod,
  customerName,
  formatAddress,
  nearestFactory,
  newProfile,
  routingAddress,
  toProfilePayload,
  validateProfile,
} from './wholesale-customer.model';

const NONE = '__none';

interface CustomerProfileEditorProps {
  /** The customer to edit; a customer without a profile becomes a wholesale customer on save. Null when closed. */
  customer: IWholesaleCustomer | null;
  factories: IWholesaleFactory[];
  routes: IWholesaleRouteDefinition[];
  readOnly: boolean;
  onClose: () => void;
  onSaved: (customer: IWholesaleCustomer) => void;
}

const Segmented = <T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) => (
  <div className="inline-flex overflow-hidden rounded-full border bg-card" role="group" aria-label={label}>
    {options.map(option => (
      <button
        key={option.value}
        type="button"
        disabled={disabled}
        aria-pressed={value === option.value}
        onClick={() => onChange(option.value)}
        className={cn(
          'h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px] disabled:cursor-not-allowed',
          value === option.value && 'bg-accent font-semibold text-accent-foreground',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const CustomerProfileEditor = ({ customer, factories, routes, readOnly, onClose, onSaved }: CustomerProfileEditorProps) => {
  const [draft, setDraft] = useState<ICustomerWholesaleProfile>(newProfile());
  const [followSuggestion, setFollowSuggestion] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUsualOrder, setShowUsualOrder] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showPortal, setShowPortal] = useState(false);

  const original = customer?.wholesaleProfile ?? null;
  const isNew = customer != null && original == null;

  useEffect(() => {
    if (customer) {
      const profile = customer.wholesaleProfile;
      setDraft(profile ? { ...newProfile(), ...profile, deliveryDays: [...(profile.deliveryDays ?? [])] } : newProfile());
      setFollowSuggestion(!profile?.factoryOverridden);
      setSubmitted(false);
    }
  }, [customer]);

  const errors = useMemo(() => validateProfile(draft), [draft]);
  const shown = submitted ? errors : {};
  const disabled = readOnly || saving;

  const set = <K extends keyof ICustomerWholesaleProfile>(key: K, value: ICustomerWholesaleProfile[K]) =>
    setDraft(prev => ({ ...prev, [key]: value }));

  const addresses = customer?.deliveryAddresses ?? [];
  const routing = routingAddress(addresses, draft.defaultDeliveryAddressId);
  const nearest = useMemo(() => nearestFactory(routing, factories), [routing, factories]);
  const factoryName = (id?: string | null) => factories.find(f => f.id === id)?.name ?? (id ? 'Unknown factory' : '-');
  const suggestionText = nearest
    ? `${nearest.factory.name} (${nearest.distanceKm.toFixed(1)} km)`
    : factories.length === 0 && original?.suggestedFactoryId
    ? factoryName(original.suggestedFactoryId)
    : null;

  const route = routes.find(r => r.id === draft.defaultRouteId);
  const stopText = !draft.defaultRouteId
    ? 'Not on a route yet.'
    : draft.defaultRouteId === original?.defaultRouteId && original?.routeStopSequence != null
    ? `Stop ${original.routeStopSequence}. Change the stop order on Route Setup.`
    : 'Added as the last stop when saved.';

  const toggleDay = (day: DayOfWeek) =>
    set('deliveryDays', draft.deliveryDays?.includes(day) ? draft.deliveryDays.filter(d => d !== day) : [...(draft.deliveryDays ?? []), day]);

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    if (!followSuggestion && !draft.factoryId) {
      toast.error('Choose a factory, or use the suggested one.');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveWholesaleProfile(customer.id, toProfilePayload(draft, followSuggestion));
      toast.success(isNew ? `${customerName(saved)} is now a wholesale customer` : `${customerName(saved)} saved`);
      onSaved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The wholesale profile could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const contact = [customer?.accountNumber, customer?.mobileNumber || customer?.phone, customer?.email].filter(Boolean).join(' / ');

  return (
    <Dialog open={customer != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isNew ? `Make ${customerName(customer)} a wholesale customer` : customerName(customer)}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{contact || 'No contact details'}</span>
            {customer && (
              <Link to={`/customer/${customer.id}/edit`} className="inline-flex items-center gap-1 text-primary hover:underline">
                Edit contact and addresses on the Customers page
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid content-start gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={draft.active !== false} onCheckedChange={checked => set('active', checked === true)} disabled={disabled} />
              Active (paused customers drop out of schedules and reminders)
            </label>

            <div className="grid gap-1.5">
              <Label>Delivery address</Label>
              <Select
                value={draft.defaultDeliveryAddressId ?? NONE}
                onValueChange={value => set('defaultDeliveryAddressId', value === NONE ? null : value)}
                disabled={disabled || addresses.length === 0}
              >
                <SelectTrigger className="ws-control" aria-label="Delivery address">
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  <SelectItem value={NONE}>Default address{routing && !draft.defaultDeliveryAddressId ? ` (${formatAddress(routing)})` : ''}</SelectItem>
                  {addresses
                    .filter(a => a.id)
                    .map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {formatAddress(a) || a.addressType || a.id}
                      </SelectItem>
                    ))}
                </WsSelectContent>
              </Select>
              {addresses.length === 0 && (
                <span className="text-xs text-[hsl(var(--ws-returned))]">No delivery address. Add one on the Customers page to get a factory suggestion.</span>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label>Route</Label>
              <Select value={draft.defaultRouteId ?? NONE} onValueChange={value => set('defaultRouteId', value === NONE ? null : value)} disabled={disabled}>
                <SelectTrigger className="ws-control" aria-label="Route">
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  <SelectItem value={NONE}>No route</SelectItem>
                  {routes.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.active === false ? ' (inactive)' : ''}
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">
                {stopText}
                {route?.factoryId && ` Route factory: ${factoryName(route.factoryId)}.`}
              </span>
            </div>

            {route?.carrierShipping && <CarrierCustomerFields profile={draft} disabled={disabled} onChange={value => set('carrierId', value)} />}

            <div className={cn('grid gap-1.5', route?.carrierShipping && 'hidden')}>
              <Label>Delivery days</Label>
              <div className="flex flex-wrap gap-1" role="group" aria-label="Delivery days">
                {DAYS.map(day => {
                  const on = draft.deliveryDays?.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      disabled={disabled}
                      aria-pressed={on}
                      onClick={() => toggleDay(day.value)}
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
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="ws-window-start">Receiving window</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ws-window-start"
                  aria-label="Window start"
                  type="time"
                  className="ws-control ws-mono"
                  value={draft.deliveryWindowStart ?? ''}
                  onChange={e => set('deliveryWindowStart', e.target.value)}
                  disabled={disabled}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  aria-label="Window end"
                  type="time"
                  className="ws-control ws-mono"
                  value={draft.deliveryWindowEnd ?? ''}
                  onChange={e => set('deliveryWindowEnd', e.target.value)}
                  disabled={disabled}
                />
              </div>
              {shown.deliveryWindow && <span className="text-xs text-destructive">{shown.deliveryWindow}</span>}
            </div>
          </div>

          <div className="grid content-start gap-3">
            <div className="grid gap-1.5">
              <Label>Factory</Label>
              <Segmented
                label="Factory choice"
                value={followSuggestion ? 'suggested' : 'chosen'}
                onChange={value => setFollowSuggestion(value === 'suggested')}
                disabled={disabled}
                options={[
                  { value: 'suggested', label: 'Nearest factory' },
                  { value: 'chosen', label: 'Choose' },
                ]}
              />
              <span className="text-xs text-muted-foreground">
                {suggestionText ? `Suggested: ${suggestionText}` : 'No suggestion: the delivery address has no coordinates or no factory has a pin.'}
              </span>
              {followSuggestion ? (
                <span className="text-xs text-muted-foreground">Follows the suggestion when the address or factories change.</span>
              ) : (
                <Select value={draft.factoryId ?? NONE} onValueChange={value => set('factoryId', value === NONE ? null : value)} disabled={disabled}>
                  <SelectTrigger className="ws-control" aria-label="Factory">
                    <SelectValue />
                  </SelectTrigger>
                  <WsSelectContent>
                    <SelectItem value={NONE}>Choose a factory</SelectItem>
                    {factories.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                        {f.active ? '' : ' (inactive)'}
                      </SelectItem>
                    ))}
                  </WsSelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Payment</Label>
                <Select
                  value={draft.defaultPaymentMethod ?? NONE}
                  onValueChange={value => set('defaultPaymentMethod', value === NONE ? null : (value as WholesalePaymentMethod))}
                  disabled={disabled}
                >
                  <SelectTrigger className="ws-control" aria-label="Payment">
                    <SelectValue />
                  </SelectTrigger>
                  <WsSelectContent>
                    <SelectItem value={NONE}>Not set</SelectItem>
                    {PAYMENT_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </WsSelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Order method</Label>
                <Select
                  value={draft.defaultOrderMethod ?? NONE}
                  onValueChange={value => set('defaultOrderMethod', value === NONE ? null : (value as OrderMethod))}
                  disabled={disabled}
                >
                  <SelectTrigger className="ws-control" aria-label="Order method">
                    <SelectValue />
                  </SelectTrigger>
                  <WsSelectContent>
                    <SelectItem value={NONE}>Not set</SelectItem>
                    {ORDER_METHODS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                    {draft.defaultOrderMethod && !ORDER_METHODS.some(m => m.value === draft.defaultOrderMethod) && (
                      <SelectItem value={draft.defaultOrderMethod}>{draft.defaultOrderMethod}</SelectItem>
                    )}
                  </WsSelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={draft.cashOnly === true} onCheckedChange={checked => set('cashOnly', checked === true)} disabled={disabled} />
              Cash only (alert when a delivery isn&apos;t paid)
            </label>

            <div className="grid gap-1.5">
              <Label htmlFor="ws-priority">Allocation priority</Label>
              <Input
                id="ws-priority"
                type="number"
                min={0}
                className="ws-control ws-mono w-32"
                value={draft.allocationPriority ?? ''}
                onChange={e => set('allocationPriority', e.target.value === '' ? null : Number(e.target.value))}
                disabled={disabled}
              />
              <span className={shown.allocationPriority ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                {shown.allocationPriority ?? 'Lower numbers keep their quantities first when a factory is short.'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {!isNew && (
            <Button variant="outline" className="ws-control" onClick={() => setShowNotes(true)} disabled={saving}>
              Notes
            </Button>
          )}
          {!isNew && (
            <Button variant="outline" className="ws-control" onClick={() => setShowUsualOrder(true)} disabled={saving}>
              Usual order
            </Button>
          )}
          {!isNew && (
            <Button variant="outline" className="ws-control sm:mr-auto" onClick={() => setShowPortal(true)} disabled={saving}>
              Portal access
            </Button>
          )}
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button className="ws-control" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Make wholesale customer' : 'Save'}
            </Button>
          )}
        </DialogFooter>
        <OrderFrequencyEditor customer={showUsualOrder ? customer : null} readOnly={readOnly} onClose={() => setShowUsualOrder(false)} />
        <CustomerNotesDialog customer={showNotes && customer ? { id: customer.id, name: customerName(customer) } : null} onClose={() => setShowNotes(false)} />
        <PortalAccessDialog
          customer={showPortal && customer ? { id: customer.id, name: customerName(customer), email: customer.email } : null}
          readOnly={readOnly}
          onClose={() => setShowPortal(false)}
        />
      </WsDialogContent>
    </Dialog>
  );
};

export default CustomerProfileEditor;
