import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { DAYS, DayOfWeek } from '../customers/wholesale-customer.model';
import { saveRoute } from './route-definition.api';
import { DEFAULT_ROUTE_COLOR, IRouteDefinition, IWholesaleDriver, driverName, newRoute, toRoutePayload, validateRoute } from './route-definition.model';

const NONE = '__none';

interface RouteEditorProps {
  /** The route to edit, a new one when it has no id, or null when closed. */
  route: IRouteDefinition | null;
  factories: IWholesaleFactory[];
  drivers: IWholesaleDriver[];
  onClose: () => void;
  onSaved: (route: IRouteDefinition) => void;
}

export const RouteEditor = ({ route, factories, drivers, onClose, onSaved }: RouteEditorProps) => {
  const [draft, setDraft] = useState<IRouteDefinition>(newRoute());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (route) {
      setDraft({ ...newRoute(), ...route, deliveryDays: [...(route.deliveryDays ?? [])] });
      setSubmitted(false);
    }
  }, [route]);

  const errors = useMemo(() => validateRoute(draft), [draft]);
  const shown = submitted ? errors : {};

  const set = <K extends keyof IRouteDefinition>(key: K, value: IRouteDefinition[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  const toggleDay = (day: DayOfWeek) =>
    set('deliveryDays', draft.deliveryDays?.includes(day) ? draft.deliveryDays.filter(d => d !== day) : [...(draft.deliveryDays ?? []), day]);

  const unknownDriver = draft.defaultDriverUsername && !drivers.some(d => d.username === draft.defaultDriverUsername);

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const saved = await saveRoute(toRoutePayload(draft));
      toast.success(`${saved.name} saved`);
      onSaved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The route could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={route != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{draft.id ? `Edit ${route?.name}` : 'New route'}</DialogTitle>
          <DialogDescription>The factory it loads from, its usual driver and the days it runs.</DialogDescription>
        </DialogHeader>

        <fieldset disabled={saving} className="grid gap-3">
          <div className="grid grid-cols-[1fr_120px_56px] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="route-name">Name</Label>
              <Input id="route-name" className="ws-control" value={draft.name ?? ''} onChange={e => set('name', e.target.value)} />
              {shown.name && <span className="text-xs text-destructive">{shown.name}</span>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="route-code">Code</Label>
              <Input id="route-code" className="ws-control ws-mono" value={draft.code ?? ''} onChange={e => set('code', e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="route-color">Colour</Label>
              <input
                id="route-color"
                type="color"
                className="ws-control w-full cursor-pointer rounded-md border bg-background p-1"
                value={draft.color || DEFAULT_ROUTE_COLOR}
                onChange={e => set('color', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Factory</Label>
              <Select value={draft.factoryId ?? NONE} onValueChange={value => set('factoryId', value === NONE ? null : value)} disabled={saving}>
                <SelectTrigger className="ws-control" aria-label="Factory">
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  <SelectItem value={NONE}>No factory</SelectItem>
                  {factories.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                      {f.active ? '' : ' (inactive)'}
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Default driver</Label>
              <Select
                value={draft.defaultDriverUsername ?? NONE}
                onValueChange={value => set('defaultDriverUsername', value === NONE ? null : value)}
                disabled={saving}
              >
                <SelectTrigger className="ws-control" aria-label="Default driver">
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  <SelectItem value={NONE}>No default driver</SelectItem>
                  {drivers.map(d => (
                    <SelectItem key={d.username} value={d.username}>
                      {driverName(d)}
                    </SelectItem>
                  ))}
                  {unknownDriver && <SelectItem value={draft.defaultDriverUsername}>{draft.defaultDriverUsername}</SelectItem>}
                </WsSelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Delivery days</Label>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Route delivery days">
              {DAYS.map(day => {
                const on = draft.deliveryDays?.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(day.value)}
                    className={cn('ws-control w-11 rounded-md border text-[13px]', on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card')}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="route-notes">Notes</Label>
            <Textarea id="route-notes" rows={2} value={draft.notes ?? ''} onChange={e => set('notes', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={draft.active !== false} onCheckedChange={checked => set('active', checked === true)} disabled={saving} />
            Active
          </label>
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

export default RouteEditor;
