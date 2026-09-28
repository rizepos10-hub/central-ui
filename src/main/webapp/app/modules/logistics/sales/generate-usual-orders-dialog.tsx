import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { OrderRegister, fetchUsualOrderPreview, generateUsualOrders } from './sales.api';
import { IUsualOrderPreview, IUsualOrderResult, formatDay } from './sales.model';

interface GenerateUsualOrdersDialogProps {
  open: boolean;
  date: string;
  routeId?: string;
  routeLabel: string;
  register?: OrderRegister;
  onClose: () => void;
  onGenerated: () => void;
}

const summary = (preview: IUsualOrderPreview) => preview.lines.map(l => `${l.quantity} x ${l.name}`).join(', ');

/**
 * Places the usual order of every customer delivering that day who has not ordered yet. The orders are saved as the
 * current user and marked as generated, so they can be checked and edited like any other order.
 */
export const GenerateUsualOrdersDialog = ({ open, date, routeId, routeLabel, register, onClose, onGenerated }: GenerateUsualOrdersDialogProps) => {
  const [preview, setPreview] = useState<IUsualOrderPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<IUsualOrderResult | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setResult(null);
    setPreview([]);
    setLoading(true);
    fetchUsualOrderPreview(date, routeId)
      .then(found => {
        if (cancelled) return;
        setPreview(found);
        setChosen(new Set(found.filter(p => !p.skipReason).map(p => p.customerId)));
      })
      .catch(error => !cancelled && toast.error(wholesaleErrorMessage(error, 'The usual orders could not be loaded.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, date, routeId]);

  const ready = useMemo(() => preview.filter(p => !p.skipReason), [preview]);
  const skipped = useMemo(() => preview.filter(p => p.skipReason), [preview]);

  const toggle = (customerId: string) =>
    setChosen(prev => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });

  const generate = async () => {
    if (!register) return;
    setGenerating(true);
    try {
      const done = await generateUsualOrders({
        date,
        routeId,
        branchId: register.branchId,
        tillId: register.tillId,
        customerIds: ready.filter(p => chosen.has(p.customerId)).map(p => p.customerId),
      });
      setResult(done);
      toast.success(`${done.created.length} usual order${done.created.length === 1 ? '' : 's'} generated`);
      onGenerated();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The usual orders could not be generated.'));
    } finally {
      setGenerating(false);
    }
  };

  const count = ready.filter(p => chosen.has(p.customerId)).length;

  return (
    <Dialog open={open} onOpenChange={value => !value && !generating && onClose()}>
      <WsDialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate usual orders</DialogTitle>
          <DialogDescription>
            {formatDay(date)} / {routeLabel}. Each order is saved as you and marked as generated from the usual order.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto text-[13px]">
          {loading && <p className="text-muted-foreground">Loading...</p>}
          {!loading && !result && preview.length === 0 && <p className="text-muted-foreground">No customers deliver on this date.</p>}

          {!loading && !result && ready.length > 0 && (
            <div className="grid gap-1" role="list" aria-label="Usual orders to generate">
              {ready.map(p => (
                <label key={p.customerId} role="listitem" className="flex items-start gap-2 border-b py-1.5">
                  <Checkbox
                    aria-label={`Generate for ${p.name}`}
                    checked={chosen.has(p.customerId)}
                    onCheckedChange={() => toggle(p.customerId)}
                    disabled={generating}
                  />
                  <span className="ws-mono w-6 text-xs text-muted-foreground">{p.stopSequence ?? ''}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-muted-foreground">{summary(p)}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {!loading && !result && skipped.length > 0 && (
            <div className="mt-3 grid gap-1">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Not generated ({skipped.length})</p>
              {skipped.map(p => (
                <div key={p.customerId} className="flex gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground">{p.name}</span>
                  <span>{p.skipReason}</span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className="grid gap-2">
              <p className="m-0 font-medium">
                {result.created.length} order{result.created.length === 1 ? '' : 's'} generated.
              </p>
              {result.skipped.length > 0 && (
                <div className="grid gap-1">
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Not generated ({result.skipped.length})</p>
                  {result.skipped.map(s => (
                    <div key={s.customerId} className="flex gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span>{s.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!register && !result && <span className="mr-auto self-center text-xs text-destructive">Choose a register first.</span>}
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={generating}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button className="ws-control" onClick={generate} disabled={generating || loading || count === 0 || !register}>
              {generating ? 'Generating...' : `Generate ${count} order${count === 1 ? '' : 's'}`}
            </Button>
          )}
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

export default GenerateUsualOrdersDialog;
