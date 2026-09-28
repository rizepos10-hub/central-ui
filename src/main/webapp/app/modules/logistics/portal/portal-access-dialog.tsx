import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchAssignableCategories } from '../salesmen/salesman.api';
import { IAssignableCategory } from '../salesmen/salesman.model';
import { fetchPortalAccess, savePortalAccess } from './portal.api';
import { IPortalAccess, MIN_PASSWORD_LENGTH, portalUrl } from './portal.model';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface PortalAccessDialogProps {
  /** Null when closed. */
  customer: { id: string; name: string; email?: string | null } | null;
  readOnly: boolean;
  onClose: () => void;
}

/** Gives a wholesale customer a sign-in for the ordering portal and chooses the categories they can order from. */
export const PortalAccessDialog = ({ customer, readOnly, onClose }: PortalAccessDialogProps) => {
  const [access, setAccess] = useState<IPortalAccess | null>(null);
  const [categories, setCategories] = useState<IAssignableCategory[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [sendInvite, setSendInvite] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setAccess(null);
    setSubmitted(false);
    setPassword('');
    Promise.all([fetchPortalAccess(customer.id), fetchAssignableCategories()])
      .then(([current, all]) => {
        setAccess(current);
        setCategories(all);
        setEnabled(current.login ? current.enabled : true);
        setEmail(current.email ?? customer.email ?? '');
        setCategoryIds(current.categoryIds ?? []);
        setSendInvite(!current.login);
      })
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The portal access could not be loaded.')));
  }, [customer]);

  const isNew = access != null && !access.login;
  const emailError = EMAIL.test(email.trim()) ? null : 'Enter a valid email';
  const passwordError =
    password === '' ? (isNew ? 'Set a temporary password' : null) : password.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters` : null;
  const disabled = readOnly || saving || access == null;

  const toggleCategory = (id: string) => setCategoryIds(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));

  const save = async () => {
    setSubmitted(true);
    if (emailError || passwordError) return;
    setSaving(true);
    try {
      const saved = await savePortalAccess(customer.id, {
        email: email.trim(),
        password: password || null,
        enabled,
        categoryIds,
        sendInvite: sendInvite && enabled,
        portalUrl: portalUrl(window.location.origin, window.location.pathname),
      });
      setAccess(saved);
      setPassword('');
      setSubmitted(false);
      toast.success(sendInvite && enabled ? `Portal access saved and emailed to ${saved.email}` : 'Portal access saved');
      onClose();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The portal access could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={customer != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Portal access{customer ? ` for ${customer.name}` : ''}</DialogTitle>
          <DialogDescription>
            The customer signs in to place and change their own orders until the factory cut-off, at their own prices.
          </DialogDescription>
        </DialogHeader>

        {access == null ? (
          <div className="py-6 text-center text-[13px] text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid content-start gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={enabled} onCheckedChange={checked => setEnabled(checked === true)} disabled={disabled} />
                Can sign in and order
              </label>
              <div className="grid gap-1.5">
                <Label htmlFor="portal-email">Email (used to sign in)</Label>
                <Input
                  id="portal-email"
                  type="email"
                  className="ws-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={disabled || !isNew}
                />
                {submitted && emailError && <span className="text-xs text-destructive">{emailError}</span>}
                {!isNew && <span className="text-xs text-muted-foreground">Username: {access.login}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="portal-password">{isNew ? 'Temporary password' : 'New temporary password (optional)'}</Label>
                <Input
                  id="portal-password"
                  type="text"
                  autoComplete="off"
                  className="ws-control ws-mono"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={disabled}
                />
                <span className={submitted && passwordError ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                  {(submitted && passwordError) || 'The customer chooses their own password after signing in.'}
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={sendInvite} onCheckedChange={checked => setSendInvite(checked === true)} disabled={disabled || !enabled} />
                Email the sign-in link{password ? ' and temporary password' : ''}
              </label>
              {access.lastInviteSentAt && (
                <span className="text-xs text-muted-foreground">Last emailed {new Date(access.lastInviteSentAt).toLocaleString()}</span>
              )}
            </div>

            <div className="grid content-start gap-2">
              <Label>Categories they can order from</Label>
              <span className="text-xs text-muted-foreground">Their usual items can always be ordered and are shown first.</span>
              <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-md border p-2" role="group" aria-label="Portal categories">
                {categories.length === 0 && <span className="text-xs text-muted-foreground">No categories.</span>}
                {categories.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-[13px]">
                    <Checkbox checked={categoryIds.includes(c.id)} onCheckedChange={() => toggleCategory(c.id)} disabled={disabled} />
                    {c.name}
                  </label>
                ))}
              </div>
              {categoryIds.length === 0 && <span className="text-xs text-[hsl(var(--ws-returned))]">No categories: only their usual items can be ordered.</span>}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button className="ws-control" onClick={save} disabled={disabled}>
              {saving ? 'Saving...' : isNew ? 'Give access' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default PortalAccessDialog;
