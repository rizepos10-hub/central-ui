import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { formatDay, toIsoDate } from '../closures/closure.model';
import { money } from '../delivery/delivery.model';
import { applyMemo, receivePayment, voidMemo } from './audits.api';
import {
  IAccountMemo,
  IInvoice,
  PAYMENT_METHOD_LABEL,
  PaymentMethod,
  allocateOldestFirst,
  invoiceKey,
  invoiceLabel,
  sumAllocations,
} from './audits.model';

const MAX_TEXT = 1000;
const cents = (value: number) => Math.round(value * 100) / 100;

export const memoLabel = (memo: IAccountMemo) => (memo.number != null ? `Credit memo #${memo.number}` : 'Credit memo');
export const memoRemaining = (memo: IAccountMemo) => memo.remaining ?? memo.total ?? 0;

// ---------------------------------------------------------------- receive payment

interface PaymentDialogProps {
  open: boolean;
  customerId: string;
  customerName?: string | null;
  invoices: IInvoice[];
  onClose: () => void;
  onDone: () => void;
}

export const paymentErrors = (amount: number | null, method: PaymentMethod, checkNumber: string, owed: number, allocated: number) => {
  const errors: Record<string, string> = {};
  if (amount == null || Number.isNaN(amount) || amount <= 0) errors.amount = 'Enter the amount received';
  else if (amount > owed + 0.005) errors.amount = `The customer owes ${money(owed)}`;
  else if (Math.abs(allocated - amount) > 0.005) errors.allocations = `The invoice amounts add up to ${money(allocated)}, not ${money(amount)}`;
  if (method === 'CHECK' && !checkNumber.trim()) errors.checkNumber = 'Enter the check number';
  return errors;
};

/** A payment received at the office, spread over open invoices oldest first unless the bookkeeper changes the split. */
export const PaymentDialog = ({ open, customerId, customerName, invoices, onClose, onDone }: PaymentDialogProps) => {
  const [paymentDate, setPaymentDate] = useState(() => toIsoDate(new Date()));
  const [method, setMethod] = useState<PaymentMethod>('CHECK');
  const [amount, setAmount] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [split, setSplit] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPaymentDate(toIsoDate(new Date()));
    setMethod('CHECK');
    setAmount('');
    setCheckNumber('');
    setReference('');
    setNote('');
    setSplit({});
    setSubmitted(false);
  }, [open]);

  const owed = useMemo(() => cents(invoices.reduce((sum, i) => sum + i.open, 0)), [invoices]);
  const amountValue = amount.trim() === '' ? null : Number(amount);
  const allocated = sumAllocations(split);
  const errors = paymentErrors(amountValue, method, checkNumber, owed, allocated);
  const tooLong = [checkNumber, reference, note].some(t => t.length > MAX_TEXT);

  const changeAmount = (text: string) => {
    setAmount(text);
    const value = Number(text);
    setSplit(text.trim() === '' || Number.isNaN(value) ? {} : allocateOldestFirst(invoices, value));
  };

  const save = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0 || tooLong) return;
    setBusy(true);
    try {
      await receivePayment(customerId, {
        paymentDate,
        method,
        amount: amountValue,
        checkNumber: method === 'CHECK' ? checkNumber.trim() : null,
        reference: reference.trim() || null,
        note: note.trim() || null,
        allocations: invoices
          .filter(i => (split[invoiceKey(i)] ?? 0) > 0)
          .map(i => ({ orderId: i.orderId, billId: i.billId, amount: split[invoiceKey(i)] })),
      });
      toast.success(`${money(amountValue)} received from ${customerName ?? 'the customer'}`);
      onDone();
      onClose();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The payment could not be saved.'));
    } finally {
      setBusy(false);
    }
  };

  const shown = submitted ? errors : {};

  return (
    <Dialog open={open} onOpenChange={on => !on && onClose()}>
      <WsDialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Receive payment</DialogTitle>
          <DialogDescription>
            {customerName ?? 'Customer'} owes {money(owed)} on {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}.
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={busy} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ws-payment-date">Date</Label>
              <Input id="ws-payment-date" type="date" className="ws-control" value={paymentDate} onChange={e => e.target.value && setPaymentDate(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={v => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="ws-control" aria-label="Method">
                  <SelectValue />
                </SelectTrigger>
                <WsSelectContent>
                  {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ws-payment-amount">Amount</Label>
              <Input
                id="ws-payment-amount"
                type="number"
                min={0}
                step="0.01"
                className="ws-control ws-mono"
                value={amount}
                onChange={e => changeAmount(e.target.value)}
              />
              {shown.amount && <span className="text-xs text-destructive">{shown.amount}</span>}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {method === 'CHECK' && (
              <div className="grid gap-1.5">
                <Label htmlFor="ws-payment-check">Check number</Label>
                <Input id="ws-payment-check" className="ws-control ws-mono" value={checkNumber} onChange={e => setCheckNumber(e.target.value)} />
                {shown.checkNumber && <span className="text-xs text-destructive">{shown.checkNumber}</span>}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="ws-payment-reference">Reference</Label>
              <Input id="ws-payment-reference" className="ws-control" value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="ws-table" data-testid="payment-split">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th className="text-right">Open</th>
                  <th className="text-right">Pay</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(i => (
                  <tr key={invoiceKey(i)}>
                    <td className="ws-mono">{invoiceLabel(i)}</td>
                    <td>{i.invoiceDate ? formatDay(i.invoiceDate) : ''}</td>
                    <td className="text-right">{money(i.open)}</td>
                    <td className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={i.open}
                        step="0.01"
                        aria-label={`Pay on ${invoiceLabel(i)}`}
                        className="ws-control ws-mono ml-auto w-28"
                        value={split[invoiceKey(i)] ?? ''}
                        onChange={e => setSplit(prev => ({ ...prev, [invoiceKey(i)]: e.target.value === '' ? 0 : Number(e.target.value) }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shown.allocations && <span className="text-xs text-destructive">{shown.allocations}</span>}

          <div className="grid gap-1.5">
            <Label htmlFor="ws-payment-note">Note</Label>
            <Textarea id="ws-payment-note" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" />
            {tooLong && <span className="text-xs text-destructive">Use at most {MAX_TEXT} characters per field</span>}
          </div>
        </fieldset>
        <DialogFooter>
          <Button variant="ghost" className="ws-control" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={save} disabled={busy || invoices.length === 0}>
            Save payment
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------- apply and void credit memos

interface MemoDialogProps {
  memo: IAccountMemo | null;
  invoices: IInvoice[];
  onClose: () => void;
  onDone: () => void;
}

/** Takes an open memo off one open invoice, up to what is left on either. */
export const ApplyMemoDialog = ({ memo, invoices, onClose, onDone }: MemoDialogProps) => {
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const invoice = invoices.find(i => invoiceKey(i) === invoiceId);
  const max = memo && invoice ? cents(Math.min(memoRemaining(memo), invoice.open)) : 0;

  useEffect(() => {
    if (!memo) return;
    const first = invoices.find(i => i.orderId === memo.orderId) ?? invoices[0];
    setInvoiceId(first ? invoiceKey(first) : '');
    setAmount(first ? String(cents(Math.min(memoRemaining(memo), first.open))) : '');
  }, [memo]);

  const chooseInvoice = (key: string) => {
    setInvoiceId(key);
    const next = invoices.find(i => invoiceKey(i) === key);
    if (memo && next) setAmount(String(cents(Math.min(memoRemaining(memo), next.open))));
  };

  const value = Number(amount);
  const error = !invoice ? 'Choose an invoice' : !(value > 0) || value > max + 0.005 ? `Enter an amount up to ${money(max)}` : null;

  const apply = async () => {
    if (error || !memo || !invoice) return;
    setBusy(true);
    try {
      await applyMemo(memo.id, invoice.orderId, invoice.billId, cents(value));
      toast.success(`${memoLabel(memo)} applied to invoice ${invoiceLabel(invoice)}`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(wholesaleErrorMessage(e, 'The credit memo could not be applied.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!memo} onOpenChange={on => !on && onClose()}>
      <WsDialogContent>
        <DialogHeader>
          <DialogTitle>Apply {memo ? memoLabel(memo) : ''}</DialogTitle>
          <DialogDescription>{memo ? `${money(memoRemaining(memo))} left to apply.` : ''}</DialogDescription>
        </DialogHeader>
        {invoices.length === 0 ? (
          <div className="text-sm text-muted-foreground">The customer has no open invoice to apply it to.</div>
        ) : (
          <fieldset disabled={busy} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Invoice</Label>
              <Select value={invoiceId} onValueChange={chooseInvoice}>
                <SelectTrigger className="ws-control" aria-label="Invoice">
                  <SelectValue placeholder="Choose an invoice" />
                </SelectTrigger>
                <WsSelectContent>
                  {invoices.map(i => (
                    <SelectItem key={invoiceKey(i)} value={invoiceKey(i)}>
                      {invoiceLabel(i)}, {i.invoiceDate ? formatDay(i.invoiceDate) : ''}, {money(i.open)} open
                    </SelectItem>
                  ))}
                </WsSelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ws-memo-amount">Amount</Label>
              <Input id="ws-memo-amount" type="number" min={0} max={max} step="0.01" className="ws-control ws-mono w-36" value={amount} onChange={e => setAmount(e.target.value)} />
              {error && <span className="text-xs text-destructive">{error}</span>}
            </div>
          </fieldset>
        )}
        <DialogFooter>
          <Button variant="ghost" className="ws-control" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={apply} disabled={busy || !!error}>
            Apply
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

/** Cancels what is left of an open memo; the reason is kept on the memo. */
export const VoidMemoDialog = ({ memo, onClose, onDone }: Omit<MemoDialogProps, 'invoices'>) => {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReason('');
    setSubmitted(false);
  }, [memo]);

  const error = !reason.trim() ? 'Enter why the memo is voided' : reason.length > MAX_TEXT ? `Use at most ${MAX_TEXT} characters` : null;

  const run = async () => {
    setSubmitted(true);
    if (error || !memo) return;
    setBusy(true);
    try {
      await voidMemo(memo.id, reason.trim());
      toast.success(`${memoLabel(memo)} voided`);
      onDone();
      onClose();
    } catch (e) {
      toast.error(wholesaleErrorMessage(e, 'The credit memo could not be voided.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!memo} onOpenChange={on => !on && onClose()}>
      <WsDialogContent>
        <DialogHeader>
          <DialogTitle>Void {memo ? memoLabel(memo) : ''}?</DialogTitle>
          <DialogDescription>{memo ? `The ${money(memoRemaining(memo))} left will no longer be owed to the customer.` : ''}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="ws-memo-void-reason">Reason</Label>
          <Textarea id="ws-memo-void-reason" rows={2} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} />
          {submitted && error && <span className="text-xs text-destructive">{error}</span>}
        </div>
        <DialogFooter>
          <Button variant="ghost" className="ws-control" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" className="ws-control" onClick={run} disabled={busy}>
            Void memo
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};
