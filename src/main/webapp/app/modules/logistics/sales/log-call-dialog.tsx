import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchCallLogs, logCall } from './sales.api';
import { CALL_OUTCOMES, CallOutcome, ICallLog, formatDay, outcomeLabel } from './sales.model';

export const CALL_LOGGED_EVENT = 'wholesale:call-logged';

interface LogCallDialogProps {
  open: boolean;
  customerId: string;
  customerName: string;
  deliveryDate: string;
  onClose: () => void;
  onSaved: (log: ICallLog) => void;
}

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

export const LogCallDialog = ({ open, customerId, customerName, deliveryDate, onClose, onSaved }: LogCallDialogProps) => {
  const [outcome, setOutcome] = useState<CallOutcome>('NO_ANSWER');
  const [followUp, setFollowUp] = useState('');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<ICallLog[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOutcome('NO_ANSWER');
    setFollowUp('');
    setNotes('');
    setHistory([]);
    fetchCallLogs(customerId, deliveryDate)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [open, customerId, deliveryDate]);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await logCall({
        customerId,
        deliveryDate,
        outcome,
        followUpAt: outcome === 'CALL_BACK' && followUp ? new Date(followUp).toISOString() : null,
        notes: notes.trim() || null,
      });
      toast.success(`${outcomeLabel(outcome)} logged for ${customerName}`);
      window.dispatchEvent(new Event(CALL_LOGGED_EVENT));
      onSaved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The call could not be logged.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && !saving && onClose()}>
      <WsDialogContent>
        <DialogHeader>
          <DialogTitle>Call to {customerName}</DialogTitle>
          <DialogDescription>For delivery on {formatDay(deliveryDate)}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={value => setOutcome(value as CallOutcome)} disabled={saving}>
              <SelectTrigger className="ws-control" aria-label="Outcome">
                <SelectValue />
              </SelectTrigger>
              <WsSelectContent>
                {CALL_OUTCOMES.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </WsSelectContent>
            </Select>
          </div>
          {outcome === 'CALL_BACK' && (
            <div className="grid gap-1.5">
              <Label htmlFor="call-follow-up">Call back at</Label>
              <Input
                id="call-follow-up"
                type="datetime-local"
                className="ws-control"
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                disabled={saving}
              />
            </div>
          )}
          <Textarea aria-label="Call notes" placeholder="Notes" rows={3} maxLength={1000} value={notes} onChange={e => setNotes(e.target.value)} disabled={saving} />
          {history.length > 0 && (
            <div className="grid gap-1 text-[13px]">
              <Label>Earlier calls for this date</Label>
              {history.map(log => (
                <div key={log.id} className="flex gap-2 text-muted-foreground">
                  <span className="ws-mono">{when(log.createdDate)}</span>
                  <span className="font-medium text-foreground">{outcomeLabel(log.outcome)}</span>
                  {log.notes && <span className="truncate">{log.notes}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Log call'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default LogCallDialog;
