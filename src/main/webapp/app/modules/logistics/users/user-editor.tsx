import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { saveUser } from './wholesale-user.api';
import { IWholesaleUser, IWholesaleUserDraft, WholesaleUserKind, kindSingular, newUser, toUserPayload, userName, validateUser } from './wholesale-user.model';

interface UserEditorProps {
  kind: WholesaleUserKind;
  /** The user to edit, a new one when it has no id, or null when closed. */
  user: IWholesaleUser | null;
  factories: IWholesaleFactory[];
  readOnly: boolean;
  onClose: () => void;
  onSaved: (user: IWholesaleUser) => void;
}

export const UserEditor = ({ kind, user, factories, readOnly, onClose, onSaved }: UserEditorProps) => {
  const [draft, setDraft] = useState<IWholesaleUserDraft>(newUser());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDraft({ ...newUser(), ...user, factoryIds: [...(user.factoryIds ?? [])] });
      setSubmitted(false);
    }
  }, [user]);

  const isNew = !draft.id;
  const errors = useMemo(() => validateUser(draft, kind), [draft, kind]);
  const shown = submitted ? errors : {};
  const disabled = readOnly || saving;

  const set = <K extends keyof IWholesaleUserDraft>(key: K, value: IWholesaleUserDraft[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  const toggleFactory = (id: string, on: boolean) =>
    set('factoryIds', on ? [...(draft.factoryIds ?? []), id] : (draft.factoryIds ?? []).filter(f => f !== id));

  const unknownFactories = (draft.factoryIds ?? []).filter(id => !factories.some(f => f.id === id));

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const saved = await saveUser(kind, draft.id, toUserPayload(draft, kind));
      toast.success(isNew ? `${userName(saved)} can now sign in` : `${userName(saved)} saved`);
      onSaved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, `The ${kindSingular(kind)} could not be saved.`));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: 'firstName' | 'lastName' | 'email', label: string, type = 'text') => (
    <div className="grid gap-1.5">
      <Label htmlFor={`ws-user-${key}`}>{label}</Label>
      <Input id={`ws-user-${key}`} type={type} className="ws-control" value={draft[key] ?? ''} onChange={e => set(key, e.target.value)} />
      {shown[key] && <span className="text-xs text-destructive">{shown[key]}</span>}
    </div>
  );

  return (
    <Dialog open={user != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{readOnly ? userName(user) : isNew ? `New ${kindSingular(kind)}` : `Edit ${userName(user)}`}</DialogTitle>
          <DialogDescription>
            {kind === 'factoryUsers'
              ? 'Signs in to the web and the factory kiosk, and only sees the factories assigned here.'
              : kind === 'drivers'
                ? "Signs in to the Wholesale Driver app and delivers the runs assigned to them. Can be a route's default driver."
                : 'Manages wholesale customers, routes, closures and salesmen.'}
          </DialogDescription>
        </DialogHeader>

        <fieldset disabled={disabled} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            {field('firstName', 'First name')}
            {field('lastName', 'Last name')}
          </div>
          {field('email', 'Email', 'email')}

          {isNew ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="ws-user-username">Username</Label>
                <Input
                  id="ws-user-username"
                  className="ws-control"
                  placeholder={draft.email?.trim() || 'Same as the email'}
                  value={draft.username ?? ''}
                  onChange={e => set('username', e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ws-user-password">Password</Label>
                <Input
                  id="ws-user-password"
                  type="password"
                  autoComplete="new-password"
                  className="ws-control"
                  value={draft.password ?? ''}
                  onChange={e => set('password', e.target.value)}
                />
                {shown.password && <span className="text-xs text-destructive">{shown.password}</span>}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={draft.temporaryPassword !== false}
                    onCheckedChange={checked => set('temporaryPassword', checked === true)}
                    disabled={disabled}
                  />
                  Ask them to choose a new password when they first sign in
                </label>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              Username <span className="ws-mono">{draft.username}</span>
            </div>
          )}

          {kind === 'factoryUsers' && (
            <div className="grid gap-1.5">
              <Label>Factories</Label>
              <div className="grid gap-1.5 rounded-md border p-2" role="group" aria-label="Factories">
                {factories.map(f => (
                  <label key={f.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={draft.factoryIds?.includes(f.id) ?? false}
                      onCheckedChange={checked => toggleFactory(f.id, checked === true)}
                      disabled={disabled}
                      aria-label={f.name}
                    />
                    {f.name}
                    {!f.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                  </label>
                ))}
                {unknownFactories.map(id => (
                  <label key={id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked onCheckedChange={() => toggleFactory(id, false)} disabled={disabled} aria-label={id} />
                    <span className="ws-mono">{id}</span> (not found)
                  </label>
                ))}
                {factories.length === 0 && unknownFactories.length === 0 && (
                  <span className="text-xs text-muted-foreground">No factories yet. Add them on the Factories page first.</span>
                )}
              </div>
              {shown.factoryIds && <span className="text-xs text-destructive">{shown.factoryIds}</span>}
            </div>
          )}
        </fieldset>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button className="ws-control" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : isNew ? `Create ${kindSingular(kind)}` : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default UserEditor;
