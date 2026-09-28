import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { createCustomerNote } from './sales.api';
import { ICustomerNote, NOTE_ROLES, NoteSource } from './sales.model';

interface CustomerNoteDialogProps {
  open: boolean;
  customerId: string;
  customerName: string;
  source: NoteSource;
  orderId?: string | null;
  onClose: () => void;
  onSaved: (note: ICustomerNote) => void;
}

const DEFAULT_ROLES = ['ROLE_WHOLESALE_SALES_MANAGER'];

/** A note about a customer, emailed to the chosen roles. Shared by Order Entry, the Call List and the customer profile. */
export const CustomerNoteDialog = ({ open, customerId, customerName, source, orderId, onClose, onSaved }: CustomerNoteDialogProps) => {
  const [text, setText] = useState('');
  const [roles, setRoles] = useState<string[]>(DEFAULT_ROLES);
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setText('');
      setRoles(DEFAULT_ROLES);
      setUrgent(false);
      setSubmitted(false);
    }
  }, [open, customerId]);

  const toggleRole = (role: string) => setRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]));

  const save = async () => {
    setSubmitted(true);
    if (!text.trim()) return;
    setSaving(true);
    try {
      const saved = await createCustomerNote({ customerId, text: text.trim(), sendToRoles: roles, urgent, source, orderId: orderId ?? null });
      toast.success(saved.emailSentAt ? 'Note saved and emailed' : 'Note saved');
      onSaved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The note could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && !saving && onClose()}>
      <WsDialogContent>
        <DialogHeader>
          <DialogTitle>Note about {customerName}</DialogTitle>
          <DialogDescription>Saved on the customer and emailed to the people you choose.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Textarea aria-label="Note" rows={4} maxLength={2000} value={text} onChange={e => setText(e.target.value)} disabled={saving} />
          {submitted && !text.trim() && <span className="text-xs text-destructive">Write the note first.</span>}
          <div className="grid gap-1.5">
            <Label>Send to</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {NOTE_ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={roles.includes(role.value)} onCheckedChange={() => toggleRole(role.value)} disabled={saving} />
                  {role.label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-sm">
            <Checkbox checked={urgent} onCheckedChange={checked => setUrgent(checked === true)} disabled={saving} />
            Urgent (flagged in the email subject)
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save note'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default CustomerNoteDialog;
