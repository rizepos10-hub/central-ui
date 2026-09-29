import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import {
  fetchClickShipPaymentMethods,
  fetchShippingServiceCharges,
  fetchShippingSettings,
  saveShippingSettings,
  testShippingProvider,
} from './shipping.api';
import {
  COUNTRIES,
  CURRENCIES,
  IPaymentMethod,
  IServiceChargeOption,
  IShippingDraft,
  IShippingSettings,
  ITestResult,
  NUMBER_LIMITS,
  NumberField,
  ShippingProvider,
  newRateRow,
  toDraft,
  toShippingPayload,
  validateShipping,
} from './shipping.model';

const NO_METHOD = '__none';
const NO_CHARGE = '__none';

const Section = ({ id, title, description, children }: { id?: string; title: string; description: React.ReactNode; children: React.ReactNode }) => (
  <section id={id} className="ws-card grid scroll-mt-4 gap-4 p-4 md:grid-cols-[260px_1fr]">
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </div>
    <div className="grid content-start gap-4">{children}</div>
  </section>
);

const Toggle = ({ id, label, description, checked, onChange }: { id: string; label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="flex items-start gap-3">
    <Checkbox id={id} className="mt-0.5" checked={checked} onCheckedChange={value => onChange(value === true)} />
    <div>
      <Label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  </div>
);

const ApiKeyField = ({
  id,
  label,
  value,
  configured,
  cleared,
  error,
  onChange,
  onClear,
}: {
  id: string;
  label: string;
  value: string;
  configured: boolean;
  cleared: boolean;
  error?: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) => (
  <div className="grid gap-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="flex flex-wrap items-center gap-2">
      <Input
        id={id}
        type="password"
        autoComplete="off"
        spellCheck={false}
        className="ws-control ws-mono w-80"
        placeholder={configured && !cleared ? 'Saved. Type a new key to replace it.' : 'Paste the API key'}
        maxLength={500}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {configured && !cleared && !value && (
        <Button type="button" variant="ghost" size="sm" className="ws-control" onClick={onClear}>
          Remove saved key
        </Button>
      )}
    </div>
    <span className={error ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
      {error ?? (cleared ? 'The saved key is removed when you save.' : 'Stored encrypted. It is never shown again after saving.')}
    </span>
  </div>
);

const ShippingSettings = () => {
  const location = useLocation();
  const [saved, setSaved] = useState<IShippingSettings | null>(null);
  const [draft, setDraft] = useState<IShippingDraft | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<ShippingProvider | null>(null);
  const [results, setResults] = useState<Partial<Record<ShippingProvider, ITestResult>>>({});
  const [methods, setMethods] = useState<IPaymentMethod[] | null>(null);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [serviceCharges, setServiceCharges] = useState<IServiceChargeOption[]>([]);

  useEffect(() => {
    fetchShippingSettings()
      .then(settings => {
        setSaved(settings);
        setDraft(toDraft(settings));
      })
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The shipping settings could not be loaded.')));
    fetchShippingServiceCharges()
      .then(setServiceCharges)
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The service charges could not be loaded.')));
  }, []);

  useEffect(() => {
    if (!draft || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [draft != null, location.hash]);

  const errors = useMemo(() => (draft && saved ? validateShipping(draft, saved) : {}), [draft, saved]);
  const shown = submitted ? errors : {};
  const dirty = useMemo(
    () => draft != null && saved != null && JSON.stringify(toShippingPayload(draft)) !== JSON.stringify(toShippingPayload(toDraft(saved))),
    [draft, saved],
  );

  if (!draft || !saved) {
    return (
      <WholesalePage title="Shipping Settings">
        <div className="py-10 text-center text-[13px] text-muted-foreground">Loading settings...</div>
      </WholesalePage>
    );
  }

  const set = <K extends keyof IShippingDraft>(key: K, value: IShippingDraft[K]) => setDraft(prev => ({ ...prev, [key]: value }));
  const setNumber = (field: NumberField, value: string) => setDraft(prev => ({ ...prev, numbers: { ...prev.numbers, [field]: value } }));
  const setRate = (key: string, patch: Partial<IShippingDraft['rateTable'][number]>) =>
    setDraft(prev => ({ ...prev, rateTable: prev.rateTable.map(row => (row.key === key ? { ...row, ...patch } : row)) }));

  const numberField = (field: NumberField, description?: string) => {
    const limit = NUMBER_LIMITS[field];
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={`ws-shipping-${field}`}>{limit.label}</Label>
        <Input
          id={`ws-shipping-${field}`}
          type="number"
          min={0}
          max={limit.max}
          step="0.1"
          className="ws-control ws-mono w-28"
          placeholder={limit.placeholder}
          value={draft.numbers[field]}
          onChange={e => setNumber(field, e.target.value)}
        />
        {(shown[field] || description) && (
          <span className={shown[field] ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>{shown[field] ?? description}</span>
        )}
      </div>
    );
  };

  const test = async (provider: ShippingProvider) => {
    setTesting(provider);
    try {
      const typed = provider === 'EASYPOST' ? draft.easyPostApiKey : draft.clickShipApiKey;
      const result = await testShippingProvider(provider, {
        apiKey: typed.trim() || null,
        sandbox: provider === 'CLICKSHIP' ? draft.clickShipSandbox : undefined,
      });
      setResults(prev => ({ ...prev, [provider]: result }));
    } catch (error) {
      setResults(prev => ({ ...prev, [provider]: { ok: false, message: wholesaleErrorMessage(error, 'The connection could not be tested.') } }));
    } finally {
      setTesting(null);
    }
  };

  const loadMethods = async () => {
    setLoadingMethods(true);
    try {
      setMethods(await fetchClickShipPaymentMethods({ apiKey: draft.clickShipApiKey.trim() || null, sandbox: draft.clickShipSandbox }));
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The ClickShip payment methods could not be loaded.'));
    } finally {
      setLoadingMethods(false);
    }
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) {
      toast.error('Fix the highlighted settings first.');
      return;
    }
    setSaving(true);
    try {
      const next = await saveShippingSettings(toShippingPayload(draft));
      setSaved(next);
      setDraft(toDraft(next));
      setSubmitted(false);
      toast.success('Shipping settings saved');
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The shipping settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const testResult = (provider: ShippingProvider) => {
    const result = results[provider];
    return result ? (
      <span role="status" className={result.ok ? 'text-xs text-emerald-700' : 'text-xs text-destructive'}>
        {result.message}
      </span>
    ) : null;
  };

  const methodOptions = methods ?? [];
  const savedMethodMissing = draft.clickShipPaymentMethodId && !methodOptions.some(m => m.id === draft.clickShipPaymentMethodId);
  const savedChargeMissing = draft.serviceChargeId && !serviceCharges.some(c => c.id === draft.serviceChargeId);

  return (
    <WholesalePage title="Shipping Settings" context="Carrier rates and labels for orders on carrier routes">
      <fieldset disabled={saving} className="grid gap-4">
        <Section
          title="How the fee is chosen"
          description="Applies to orders on carrier routes only. Other orders are not affected."
        >
          <ul className="list-disc space-y-1 pl-5 text-[13px]">
            <li>Every connected provider is asked for rates and the cheapest one is used, plus your markup.</li>
            <li>Orders heavier than the largest parcel ship on a pallet, which only ClickShip quotes.</li>
            <li>If no provider is connected or every provider fails, the rate table price is used.</li>
            <li>The fee is added to the order as a Shipping charge. You can change it per order on the Shipments page.</li>
          </ul>
        </Section>

        <Section
          id="easypost"
          title="EasyPost"
          description={
            <>
              Parcel rates and labels from the carriers connected in your EasyPost account. Find the API key in EasyPost under Account
              Settings, API Keys. Test keys start with EZTK.
            </>
          }
        >
          <Toggle
            id="ws-shipping-easypost"
            label="Use EasyPost"
            checked={draft.easyPostEnabled}
            onChange={checked => set('easyPostEnabled', checked)}
          />
          <ApiKeyField
            id="ws-shipping-easypost-key"
            label="EasyPost API key"
            value={draft.easyPostApiKey}
            configured={saved.easyPostApiKeyConfigured === true}
            cleared={draft.clearEasyPostApiKey}
            error={shown.easyPostApiKey}
            onChange={value => set('easyPostApiKey', value)}
            onClear={() => set('clearEasyPostApiKey', true)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="ws-control" disabled={testing != null} onClick={() => test('EASYPOST')}>
              {testing === 'EASYPOST' ? 'Testing...' : 'Test connection'}
            </Button>
            {testResult('EASYPOST')}
          </div>
        </Section>

        <Section
          id="clickship"
          title="ClickShip"
          description="Parcel and pallet (LTL) rates and labels through your ClickShip account, using the Freightcom API. Get the API key from ClickShip support."
        >
          <Toggle
            id="ws-shipping-clickship"
            label="Use ClickShip"
            checked={draft.clickShipEnabled}
            onChange={checked => set('clickShipEnabled', checked)}
          />
          <ApiKeyField
            id="ws-shipping-clickship-key"
            label="ClickShip API key"
            value={draft.clickShipApiKey}
            configured={saved.clickShipApiKeyConfigured === true}
            cleared={draft.clearClickShipApiKey}
            error={shown.clickShipApiKey}
            onChange={value => set('clickShipApiKey', value)}
            onClear={() => set('clearClickShipApiKey', true)}
          />
          <Toggle
            id="ws-shipping-clickship-sandbox"
            label="Test environment"
            description="Use the Freightcom test environment; nothing is really shipped or charged."
            checked={draft.clickShipSandbox}
            onChange={checked => set('clickShipSandbox', checked)}
          />
          <div className="grid gap-1.5">
            <Label>Payment method</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={draft.clickShipPaymentMethodId || NO_METHOD}
                onValueChange={value => set('clickShipPaymentMethodId', value === NO_METHOD ? '' : value)}
              >
                <SelectTrigger className="ws-control w-72" aria-label="ClickShip payment method">
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  <SelectItem value={NO_METHOD}>Choose a payment method</SelectItem>
                  {methodOptions.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label || m.type || m.id}
                    </SelectItem>
                  ))}
                  {savedMethodMissing && <SelectItem value={draft.clickShipPaymentMethodId}>Saved payment method</SelectItem>}
                </WsSelectContent>
              </Select>
              <Button type="button" variant="outline" className="ws-control" disabled={loadingMethods} onClick={loadMethods}>
                {loadingMethods ? 'Loading...' : 'Load payment methods'}
              </Button>
            </div>
            <span className={shown.clickShipPaymentMethodId ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {shown.clickShipPaymentMethodId ?? 'Labels bought through ClickShip are paid with this method.'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" className="ws-control" disabled={testing != null} onClick={() => test('CLICKSHIP')}>
              {testing === 'CLICKSHIP' ? 'Testing...' : 'Test connection'}
            </Button>
            {testResult('CLICKSHIP')}
          </div>
        </Section>

        <Section title="Fee" description="How the shipping fee is priced and charged.">
          <div className="grid gap-1.5">
            <Label>Currency</Label>
            <Select value={draft.currency} onValueChange={value => set('currency', value)}>
              <SelectTrigger className="ws-control w-28" aria-label="Currency">
                <SelectValue />
              </SelectTrigger>
              <WsSelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </WsSelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Rates in other currencies are only used when none come in this one.</span>
          </div>
          <div className="grid gap-1.5">
            <Label>Charge as</Label>
            <Select value={draft.serviceChargeId || NO_CHARGE} onValueChange={value => set('serviceChargeId', value === NO_CHARGE ? '' : value)}>
              <SelectTrigger className="ws-control w-72" aria-label="Shipping service charge">
                <SelectValue />
              </SelectTrigger>
              <WsSelectContent>
                <SelectItem value={NO_CHARGE}>None (Shipping, untaxed)</SelectItem>
                {serviceCharges.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || 'Unnamed'}
                    {c.accountingGroupName ? ` (${c.accountingGroupName})` : ' (untaxed)'}
                  </SelectItem>
                ))}
                {savedChargeMissing && <SelectItem value={draft.serviceChargeId}>Saved service charge (no longer available)</SelectItem>}
              </WsSelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              A service charge of type Shipping fee. The fee is charged under its name and taxed with its accounting group; its own amount
              is not used.
            </span>
          </div>
          {numberField('markupPercent', 'Added on top of the carrier rate. The rate table price is used as is.')}
          {numberField('weightPerUnitKg', 'Shipping weight of one unit ordered, packaging included. The order weight is units times this.')}
          <Toggle
            id="ws-shipping-autobuy"
            label="Buy the label when shipping"
            description="Ship without a tracking number to buy the label from the provider that quoted the order."
            checked={draft.autoBuyLabel}
            onChange={checked => set('autoBuyLabel', checked)}
          />
        </Section>

        <Section title="Packages" description="Box and pallet sizes sent to the carriers. Empty fields use the value shown.">
          <div className="flex flex-wrap gap-4">
            {numberField('parcelLengthCm')}
            {numberField('parcelWidthCm')}
            {numberField('parcelHeightCm')}
            {numberField('maxParcelWeightKg')}
          </div>
          <div className="flex flex-wrap gap-4">
            {numberField('palletLengthCm')}
            {numberField('palletWidthCm')}
            {numberField('palletHeightCm')}
          </div>
        </Section>

        <Section
          title="Rate table"
          description="Used when no provider is connected or none answers. A province or state row wins over the row for its whole country."
        >
          {draft.rateTable.length > 0 && (
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Province or state</th>
                  <th className="ws-num">Flat fee</th>
                  <th className="ws-num">Per kg</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.rateTable.map((row, index) => (
                  <React.Fragment key={row.key}>
                    <tr>
                      <td>
                        <Select value={row.country} onValueChange={value => setRate(row.key, { country: value })}>
                          <SelectTrigger className="ws-control w-40" aria-label={`Rate ${index + 1} country`}>
                            <SelectValue />
                          </SelectTrigger>
                          <WsSelectContent>
                            {COUNTRIES.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </WsSelectContent>
                        </Select>
                      </td>
                      <td>
                        <Input
                          aria-label={`Rate ${index + 1} province`}
                          className="ws-control ws-mono w-28 uppercase"
                          placeholder="All"
                          maxLength={40}
                          value={row.region}
                          onChange={e => setRate(row.key, { region: e.target.value })}
                        />
                      </td>
                      <td className="ws-num">
                        <Input
                          aria-label={`Rate ${index + 1} flat fee`}
                          type="number"
                          min={0}
                          step="0.01"
                          className="ws-control ws-mono ml-auto w-28"
                          value={row.baseFee}
                          onChange={e => setRate(row.key, { baseFee: e.target.value })}
                        />
                      </td>
                      <td className="ws-num">
                        <Input
                          aria-label={`Rate ${index + 1} per kg`}
                          type="number"
                          min={0}
                          step="0.01"
                          className="ws-control ws-mono ml-auto w-28"
                          value={row.perKg}
                          onChange={e => setRate(row.key, { perKg: e.target.value })}
                        />
                      </td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Remove rate ${index + 1}`}
                          onClick={() => set('rateTable', draft.rateTable.filter(r => r.key !== row.key))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                    {shown[`rate-${row.key}`] && (
                      <tr>
                        <td colSpan={5} className="text-xs text-destructive">
                          {shown[`rate-${row.key}`]}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
          <div>
            <Button type="button" variant="outline" className="ws-control" onClick={() => set('rateTable', [...draft.rateTable, newRateRow()])}>
              Add rate
            </Button>
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
              setDraft(toDraft(saved));
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

export default ShippingSettings;
