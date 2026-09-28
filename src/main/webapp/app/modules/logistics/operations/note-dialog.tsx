import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';

interface NoteDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  label?: string;
  /** When set, the note cannot be empty and this is the message shown. */
  requiredMessage?: string;
  confirmLabel: string;
  destructive?: boolean;
  children?: React.ReactNode;
  onClose: () => void;
  /** Resolves when done; the dialog stays open (and busy) until then. */
  onConfirm: (note: string) => Promise<unknown>;
}

/** Confirmation with an optional or required note, used for submit, approve, reopen, send and similar steps. */
export const NoteDialog = ({ open, title, description, label = 'Note', requiredMessage, confirmLabel, destructive, children, onClose, onConfirm }: NoteDialogProps) => {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setNote('');
      setSubmitted(false);
    }
  }, [open]);

  const missing = requiredMessage != null && !note.trim();

  const confirm = async () => {
    setSubmitted(true);
    if (missing) return;
    setBusy(true);
    try {
      await onConfirm(note.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && !busy && onClose()}>
      <WsDialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <Textarea
          aria-label={label}
          placeholder={requiredMessage ? label : `${label} (optional)`}
          rows={3}
          maxLength={1000}
          value={note}
          onChange={e => setNote(e.target.value)}
          disabled={busy}
        />
        {submitted && missing && <span className="text-xs text-destructive">{requiredMessage}</span>}
        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className={destructive ? 'ws-control bg-destructive text-white hover:bg-destructive/90' : 'ws-control'} onClick={confirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default NoteDialog;
