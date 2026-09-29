import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { changePassword } from './portal.api';
import { MIN_PASSWORD_LENGTH, validatePassword } from './portal.model';

/** First sign-in: the customer replaces the password their supplier gave them. */
export const PortalPassword = ({ name, onDone }: { name: string; onDone: () => void }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const error = validatePassword(password, confirm);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (error) return;
    setSaving(true);
    try {
      await changePassword(password);
      onDone();
    } catch (err) {
      setServerError(wholesaleErrorMessage(err, 'The password could not be changed.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <form onSubmit={save} className="ws-card grid w-full max-w-sm gap-4 p-6">
        <div className="grid gap-1">
          <KeyRound className="h-6 w-6 text-primary" />
          <h1 className="m-0 text-lg font-semibold">Welcome, {name}</h1>
          <p className="m-0 text-[13px] text-muted-foreground">Choose your own password before you start ordering.</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="portal-password">New password</Label>
          <Input
            id="portal-password"
            type="password"
            autoComplete="new-password"
            className="ws-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</span>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="portal-password-confirm">Repeat the password</Label>
          <Input
            id="portal-password-confirm"
            type="password"
            autoComplete="new-password"
            className="ws-control"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>
        {((submitted && error) || serverError) && (
          <span role="alert" className="text-xs text-destructive">
            {serverError ?? error}
          </span>
        )}
        <Button type="submit" className="ws-control" disabled={saving}>
          {saving ? 'Saving...' : 'Save password'}
        </Button>
      </form>
    </div>
  );
};

export default PortalPassword;
