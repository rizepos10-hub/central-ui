import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { saveSalesman } from './salesman.api';
import { IBranchRef, ISalesman, ISalesmanDraft, newSalesman, salesmanName, toSalesmanPayload, validateSalesman } from './salesman.model';

interface SalesmanEditorProps {
  /** The salesman to edit, a new one when it has no id, or null when closed. */
  salesman: ISalesman | null;
  branches: IBranchRef[];
  onClose: () => void;
  onSaved: (salesman: ISalesman) => void;
}

export const SalesmanEditor = ({ salesman, branches, onClose, onSaved }: SalesmanEditorProps) => {
  const [draft, setDraft] = useState<ISalesmanDraft>(newSalesman());
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (salesman) {
      setDraft({ ...newSalesman(), ...salesman, password: '', branches: [...(salesman.branches ?? [])] });
      setSubmitted(false);
    }
  }, [salesman]);

  const isNew = !draft.id;
  const errors = useMemo(() => validateSalesman(draft), [draft]);
  const shown = submitted ? errors : {};

  const set = <K extends keyof ISalesmanDraft>(key: K, value: ISalesmanDraft[K]) => setDraft(prev => ({ ...prev, [key]: value }));

  const hasBranch = (id: string) => (draft.branches ?? []).some(b => b.id === id);
  const toggleBranch = (branch: IBranchRef, on: boolean) =>
    set('branches', on ? [...(draft.branches ?? []), branch] : (draft.branches ?? []).filter(b => b.id !== branch.id));

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const saved = await saveSalesman(draft.id, toSalesmanPayload(draft));
      toast.success(isNew ? `${salesmanName(saved)} can now sign in` : `${salesmanName(saved)} saved`);
      onSaved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The salesman could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const field = (key: 'firstName' | 'lastName' | 'email', label: string, type = 'text') => (
    <div className="grid gap-1.5">
      <Label htmlFor={`ws-salesman-${key}`}>{label}</Label>
      <Input id={`ws-salesman-${key}`} type={type} className="ws-control" value={draft[key] ?? ''} onChange={e => set(key, e.target.value)} />
      {shown[key] && <span className="text-xs text-destructive">{shown[key]}</span>}
    </div>
  );

  return (
    <Dialog open={salesman != null} onOpenChange={open => !open && !saving && onClose()}>
      <WsDialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New salesman' : `Edit ${salesmanName(salesman)}`}</DialogTitle>
          <DialogDescription>
            Signs in to Order Entry and the Call List, and only sees the customers and product categories assigned to them.
          </DialogDescription>
        </DialogHeader>

        <fieldset disabled={saving} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            {field('firstName', 'First name')}
            {field('lastName', 'Last name')}
          </div>
          {field('email', 'Email', 'email')}

          {isNew ? (
            <div className="grid gap-1.5">
              <Label htmlFor="ws-salesman-username">Username</Label>
              <Input
                id="ws-salesman-username"
                className="ws-control"
                placeholder={draft.email?.trim() || 'Same as the email'}
                value={draft.username ?? ''}
                onChange={e => set('username', e.target.value)}
              />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Username <span className="ws-mono">{draft.username}</span>
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="ws-salesman-password">{isNew ? 'Password' : 'New password'}</Label>
            <Input
              id="ws-salesman-password"
              type="password"
              autoComplete="new-password"
              className="ws-control"
              placeholder={isNew ? undefined : 'Leave empty to keep the current password'}
              value={draft.password ?? ''}
              onChange={e => set('password', e.target.value)}
            />
            {shown.password && <span className="text-xs text-destructive">{shown.password}</span>}
            {(isNew || draft.password) && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={draft.temporaryPassword !== false}
                  onCheckedChange={checked => set('temporaryPassword', checked === true)}
                  disabled={saving}
                />
                Ask them to choose a new password when they next sign in
              </label>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Branches</Label>
            <div className="grid max-h-40 gap-1.5 overflow-y-auto rounded-md border p-2" role="group" aria-label="Branches">
              {branches.map(b => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={hasBranch(b.id)} onCheckedChange={checked => toggleBranch(b, checked === true)} disabled={saving} aria-label={b.name ?? b.id} />
                  {b.name ?? b.id}
                </label>
              ))}
              {branches.length === 0 && <span className="text-xs text-muted-foreground">No branches found.</span>}
            </div>
          </div>
        </fieldset>

        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create salesman' : 'Save'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default SalesmanEditor;
