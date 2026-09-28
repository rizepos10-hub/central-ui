import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchInvoices, issueInvoices } from './operations.api';
import { IInvoiceRow, formatTime } from './operations.model';

interface InvoicesPanelProps {
  factoryOrderId: string;
  routeNames: Record<string, string>;
  canIssue: boolean;
}

const money = (value?: number | null) => (value == null ? '' : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

/** The customer orders on an approved factory order and their invoices; issuing leaves invoiced bills alone. */
export const InvoicesPanel = ({ factoryOrderId, routeNames, canIssue }: InvoicesPanelProps) => {
  const [rows, setRows] = useState<IInvoiceRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetchInvoices(factoryOrderId)
      .then(setRows)
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The invoices could not be loaded.')));
  }, [factoryOrderId]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = rows.filter(r => r.invoiceNumber == null);
  const toggle = (orderId: string) => setSelected(prev => (prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]));

  const issue = async () => {
    setBusy(true);
    try {
      const result = await issueInvoices(factoryOrderId, selected);
      const parts = [`${result.issued} issued`, `${result.emailed} emailed`];
      if (result.skipped.length) parts.push(`${result.skipped.length} skipped`);
      toast.success(`Invoices: ${parts.join(', ')}`);
      result.skipped.forEach(s => toast.info(`${s.customerName ?? 'A customer'}: ${s.reason}`));
      setSelected([]);
      load();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The invoices could not be issued.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ws-card overflow-x-auto" data-testid="invoices-panel">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <h2 className="m-0 text-base font-semibold">Invoices</h2>
        <span className="text-sm text-muted-foreground">
          {rows.length - pending.length} of {rows.length} invoiced
        </span>
        <div className="flex-1" />
        {canIssue && pending.length > 0 && (
          <Button className="ws-control" onClick={issue} disabled={busy}>
            {busy ? 'Issuing...' : selected.length ? `Issue ${selected.length} selected` : `Issue all ${pending.length}`}
          </Button>
        )}
      </div>
      <table className="ws-table">
        <thead>
          <tr>
            {canIssue && <th className="w-8" />}
            <th>Customer</th>
            <th>Route</th>
            <th className="text-right">Total</th>
            <th>Invoice</th>
            <th>Emailed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={`${row.orderId}-${row.billId ?? ''}`}>
              {canIssue && (
                <td>
                  {row.invoiceNumber == null && (
                    <Checkbox aria-label={`Select ${row.customerName}`} checked={selected.includes(row.orderId)} onCheckedChange={() => toggle(row.orderId)} />
                  )}
                </td>
              )}
              <td className="font-medium">{row.customerName}</td>
              <td className="text-muted-foreground">{routeNames[row.routeId] ?? ''}</td>
              <td className="text-right">{money(row.total)}</td>
              <td>{row.invoiceNumber != null ? `#${row.invoiceNumber}` : <span className="text-muted-foreground">Not issued</span>}</td>
              <td className="text-muted-foreground">{row.invoiceEmailedAt ? formatTime(row.invoiceEmailedAt) : row.email ? '' : 'No email'}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={canIssue ? 6 : 5} className="py-6 text-center text-muted-foreground">
                No customer orders on this factory order.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesPanel;
