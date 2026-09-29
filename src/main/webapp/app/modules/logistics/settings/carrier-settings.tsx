import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { IWholesaleCarrier, IWholesaleSettings, SettingsErrors, addUnique, isTime } from './wholesale-settings.model';

interface Props {
  draft: IWholesaleSettings;
  errors: SettingsErrors;
  set: <K extends keyof IWholesaleSettings>(key: K, value: IWholesaleSettings[K]) => void;
  /** Renders the dispatch choice with the page's radio cards. */
  dispatchChoice: React.ReactNode;
  /** Renders removable time chips the same way as the reminder times. */
  chips: (values: string[], label: string, onRemove: (value: string) => void) => React.ReactNode;
}

export const CarrierSettings = ({ draft, errors, set, dispatchChoice, chips }: Props) => {
  const [newTime, setNewTime] = useState('');
  const enabled = draft.carrierShippingEnabled === true;
  const carriers = draft.carriers ?? [];
  const times = draft.carrierCutoffTimes ?? [];

  const update = (index: number, patch: Partial<IWholesaleCarrier>) =>
    set(
      'carriers',
      carriers.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );

  const addTime = () => {
    if (!isTime(newTime)) return;
    set('carrierCutoffTimes', addUnique(times, newTime.trim(), true));
    setNewTime('');
  };

  return (
    <>
      <div className="flex items-start gap-3">
        <Checkbox
          id="ws-setting-carrierShippingEnabled"
          className="mt-0.5"
          checked={enabled}
          onCheckedChange={checked => set('carrierShippingEnabled', checked === true)}
        />
        <div>
          <Label htmlFor="ws-setting-carrierShippingEnabled" className="text-[13px] font-medium">
            Ship by carrier
          </Label>
          <p className="text-xs text-muted-foreground">
            Customers on a carrier route are shipped by a carrier instead of a driver. Carrier routes are open every day and have no driver
            or order sheet. Carrier customers must pay on account.
          </p>
        </div>
      </div>

      {enabled && (
        <>
          <div className="grid gap-1.5">
            <Label>Carriers</Label>
            {carriers.length === 0 && (
              <span className="text-xs text-muted-foreground">No carriers yet. Add the carriers you ship with.</span>
            )}
            <ul className="grid gap-2" aria-label="Carriers">
              {carriers.map((carrier, index) => (
                <li key={carrier.id ?? `new-${index}`} className="grid items-center gap-2 sm:grid-cols-[180px_1fr_auto_auto]">
                  <Input
                    aria-label={`Carrier ${index + 1} name`}
                    className="ws-control"
                    placeholder="Carrier name"
                    value={carrier.name ?? ''}
                    onChange={e => update(index, { name: e.target.value })}
                  />
                  <Input
                    aria-label={`Carrier ${index + 1} tracking link`}
                    className="ws-control ws-mono"
                    placeholder="https://carrier.com/track?n={tracking}"
                    value={carrier.trackingUrl ?? ''}
                    onChange={e => update(index, { trackingUrl: e.target.value })}
                  />
                  <label className="flex items-center gap-1.5 text-[13px]">
                    <Checkbox checked={carrier.active !== false} onCheckedChange={checked => update(index, { active: checked === true })} />
                    Active
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove carrier ${carrier.name || index + 1}`}
                    onClick={() =>
                      set(
                        'carriers',
                        carriers.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div>
              <Button
                type="button"
                variant="outline"
                className="ws-control"
                onClick={() => set('carriers', [...carriers, { name: '', trackingUrl: '', active: true }])}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add carrier
              </Button>
            </div>
            <span className={errors.carriers ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {errors.carriers ??
                'Put {tracking} in the link where the tracking number goes, so customers and staff can follow the parcel.'}
            </span>
          </div>

          {dispatchChoice}

          {draft.carrierDispatch === 'AT_CUTOFF_TIMES' && (
            <div className="grid gap-1.5">
              <Label htmlFor="ws-carrier-cutoff">Cut-off times</Label>
              {chips(times, 'Saved carrier cut-off times', value =>
                set(
                  'carrierCutoffTimes',
                  times.filter(t => t !== value)
                )
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="ws-carrier-cutoff"
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
              <span className={errors.carrierCutoffTimes ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                {errors.carrierCutoffTimes ?? 'Orders for today and tomorrow placed before each time go to the factory together.'}
              </span>
            </div>
          )}
        </>
      )}
    </>
  );
};
