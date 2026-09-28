import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WsSheetContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { addDays, formatDay } from '../closures/closure.model';
import { formatTime } from '../operations/operations.model';
import { MEMO_REASON_LABEL, money } from '../delivery/delivery.model';
import { fetchAccount, fetchStatement } from './audits.api';
import { AGING_COLUMNS, IAccountMemo, ICustomerAccount, IStatement, LINE_TYPE_LABEL, PAYMENT_METHOD_LABEL, invoiceLabel } from './audits.model';
import { ApplyMemoDialog, PaymentDialog, VoidMemoDialog, memoLabel, memoRemaining } from './account-actions';

interface CustomerAccountSheetProps {
  customerId: string | null;
  asOf: string;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}

const firstOfMonth = (iso: string) => `${iso.slice(0, 8)}01`;

export const invoicePrintLink = (orderId: string, billId?: string | null) => (billId ? `/order/${orderId}/print/${billId}` : `/order/${orderId}`);

/** One customer's balance: aging, open invoices and memos, payments, and a statement for any period. */
export const CustomerAccountSheet = ({ customerId, asOf, canManage, onClose, onChanged }: CustomerAccountSheetProps) => {
  const [tab, setTab] = useState<'account' | 'statement'>('account');
  const [account, setAccount] = useState<ICustomerAccount | null>(null);
  const [statement, setStatement] = useState<IStatement | null>(null);
  const [from, setFrom] = useState(() => addDays(firstOfMonth(asOf), -60));
  const [to, setTo] = useState(asOf);
  const [paying, setPaying] = useState(false);
  const [applying, setApplying] = useState<IAccountMemo | null>(null);
  const [voiding, setVoiding] = useState<IAccountMemo | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const print = useReactToPrint({ content: () => printRef.current, documentTitle: `Statement ${account?.customerName ?? ''}` });

  const accountRequest = useRef(0);
  const loadAccount = useCallback(async () => {
    if (!customerId) return;
    const current = ++accountRequest.current;
    try {
      const result = await fetchAccount(customerId, asOf);
      if (current === accountRequest.current) setAccount(result);
    } catch (error) {
      if (current === accountRequest.current) toast.error(wholesaleErrorMessage(error, 'The account could not be loaded.'));
    }
  }, [customerId, asOf]);

  const statementRequest = useRef(0);
  const loadStatement = useCallback(async () => {
    if (!customerId || tab !== 'statement') return;
    const current = ++statementRequest.current;
    try {
      const result = await fetchStatement(customerId, from, to);
      if (current === statementRequest.current) setStatement(result);
    } catch (error) {
      if (current === statementRequest.current) toast.error(wholesaleErrorMessage(error, 'The statement could not be loaded.'));
    }
  }, [customerId, from, to, tab]);

  useEffect(() => {
    setAccount(null);
    setStatement(null);
    setTab('account');
    loadAccount();
  }, [loadAccount]);

  useEffect(() => {
    loadStatement();
  }, [loadStatement]);

  useEffect(() => {
    setTo(asOf);
    setFrom(addDays(firstOfMonth(asOf), -60));
  }, [asOf]);

  const changed = () => {
    loadAccount();
    setStatement(null);
    loadStatement();
    onChanged();
  };

  const invoices = account?.openInvoices ?? [];
  const memos = account?.openMemos ?? [];

  return (
    <Sheet open={customerId != null} onOpenChange={value => !value && onClose()}>
      <WsSheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{account?.customerName ?? 'Loading account...'}</SheetTitle>
          <SheetDescription>{account ? `Balance on ${formatDay(account.asOf)}` : ' '}</SheetDescription>
        </SheetHeader>

        {account && (
          <div className="mt-4 grid gap-5" data-testid="customer-account">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md border p-0.5" role="tablist">
                {(['account', 'statement'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    className={cn('rounded px-3 py-1 text-sm', tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
                    onClick={() => setTab(t)}
                  >
                    {t === 'account' ? 'Account' : 'Statement'}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              {canManage && (
                <Button className="ws-control" onClick={() => setPaying(true)} disabled={invoices.length === 0}>
                  Receive payment
                </Button>
              )}
            </div>

            {tab === 'account' && (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {AGING_COLUMNS.map(c => (
                    <div key={c.key} className="ws-card grid px-3 py-2">
                      <span className="text-xs text-muted-foreground">{c.label}</span>
                      <span className="font-semibold">{money(account.aging[c.key])}</span>
                    </div>
                  ))}
                  <div className="ws-card grid px-3 py-2">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="font-semibold" data-testid="account-total">
                      {money(account.aging.total)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {account.openCredit > 0 && <span>Open credit: {money(account.openCredit)}</span>}
                  {account.onAccountEnabled && (
                    <span>
                      On account: {money(account.onAccountBalance)}
                      {account.onAccountLimit != null ? ` of ${money(account.onAccountLimit)} limit` : ''}
                    </span>
                  )}
                </div>

                <section className="grid gap-2">
                  <h3 className="m-0 text-sm font-semibold">Open invoices</h3>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="ws-table" data-testid="open-invoices">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Date</th>
                          <th className="text-right">Days</th>
                          <th className="text-right">Total</th>
                          <th className="text-right">Paid</th>
                          <th className="text-right">Open</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(i => (
                          <tr key={i.billId ?? i.orderId}>
                            <td className="ws-mono">{invoiceLabel(i)}</td>
                            <td>{i.invoiceDate ? formatDay(i.invoiceDate) : ''}</td>
                            <td className="text-right">{i.ageDays}</td>
                            <td className="text-right">{money(i.total)}</td>
                            <td className="text-right">{money(i.paid + i.onAccountSettled)}</td>
                            <td className="text-right font-semibold">{money(i.open)}</td>
                            <td className="text-right">
                              <Link to={invoicePrintLink(i.orderId, i.billId)} className="text-sm text-primary hover:underline">
                                Print
                              </Link>
                            </td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-muted-foreground">
                              Nothing is owed.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {memos.length > 0 && (
                  <section className="grid gap-2">
                    <h3 className="m-0 text-sm font-semibold">Open credit memos</h3>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="ws-table" data-testid="open-memos">
                        <thead>
                          <tr>
                            <th>Memo</th>
                            <th>Reason</th>
                            <th>Delivery</th>
                            <th className="text-right">Total</th>
                            <th className="text-right">Left</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {memos.map(m => (
                            <tr key={m.id}>
                              <td>
                                <Link to={`/logistics/credit-memos?memo=${m.id}`}>{memoLabel(m)}</Link>
                              </td>
                              <td>{m.reason ? MEMO_REASON_LABEL[m.reason] : ''}</td>
                              <td>{m.deliveryDate ? formatDay(m.deliveryDate) : ''}</td>
                              <td className="text-right">{money(m.total)}</td>
                              <td className="text-right font-semibold">{money(memoRemaining(m))}</td>
                              <td className="whitespace-nowrap text-right">
                                {canManage && (
                                  <>
                                    <Button size="sm" variant="outline" className="ws-control mr-1" onClick={() => setApplying(m)}>
                                      Apply
                                    </Button>
                                    <Button size="sm" variant="ghost" className="ws-control" onClick={() => setVoiding(m)}>
                                      Void
                                    </Button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                <section className="grid gap-2">
                  <h3 className="m-0 text-sm font-semibold">Recent payments</h3>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="ws-table" data-testid="recent-payments">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Method</th>
                          <th className="text-right">Amount</th>
                          <th>Invoices</th>
                          <th>Received by</th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.recentPayments.map(p => (
                          <tr key={p.id}>
                            <td>{p.paymentDate ? formatDay(p.paymentDate) : ''}</td>
                            <td>
                              {p.method ? PAYMENT_METHOD_LABEL[p.method] : ''}
                              {p.checkNumber ? <span className="ws-mono ml-1 text-muted-foreground">#{p.checkNumber}</span> : null}
                            </td>
                            <td className="text-right">{money(p.amount)}</td>
                            <td className="ws-mono text-xs">
                              {(p.allocations ?? []).map(a => `${a.invoiceNumber != null ? `#${a.invoiceNumber}` : 'Invoice'} ${money(a.amount)}`).join(', ')}
                            </td>
                            <td className="text-xs text-muted-foreground">
                              {p.receivedBy} {formatTime(p.receivedAt)}
                            </td>
                          </tr>
                        ))}
                        {account.recentPayments.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-muted-foreground">
                              No payments received at the office yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {tab === 'statement' && (
              <section className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="date" aria-label="From" className="ws-control w-40" value={from} max={to} onChange={e => e.target.value && setFrom(e.target.value)} />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input type="date" aria-label="To" className="ws-control w-40" value={to} min={from} onChange={e => e.target.value && setTo(e.target.value)} />
                  <div className="flex-1" />
                  <Button variant="outline" className="ws-control" onClick={print} disabled={!statement}>
                    <Printer className="mr-1 h-4 w-4" /> Print
                  </Button>
                </div>
                {!statement ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Loading statement...</div>
                ) : (
                  <div ref={printRef} className="grid gap-3 print:p-8">
                    <div className="hidden print:block">
                      <h2 className="m-0 text-lg font-semibold">Statement: {statement.customerName}</h2>
                      <div className="text-sm">
                        {formatDay(statement.from)} to {formatDay(statement.to)}
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="ws-table" data-testid="statement">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Reference</th>
                            <th className="text-right">Charges</th>
                            <th className="text-right">Credits</th>
                            <th className="text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{formatDay(statement.from)}</td>
                            <td colSpan={4} className="text-muted-foreground">
                              Opening balance
                            </td>
                            <td className="text-right font-semibold">{money(statement.openingBalance)}</td>
                          </tr>
                          {statement.lines.map((l, index) => (
                            <tr key={`${l.date}-${l.type}-${l.reference ?? ''}-${index}`}>
                              <td>{formatDay(l.date)}</td>
                              <td>{LINE_TYPE_LABEL[l.type] ?? l.type}</td>
                              <td>
                                <span className="ws-mono">{l.reference}</span>
                                {l.description && <div className="text-xs text-muted-foreground">{l.description}</div>}
                              </td>
                              <td className="text-right">{l.debit ? money(l.debit) : ''}</td>
                              <td className="text-right">{l.credit ? money(l.credit) : ''}</td>
                              <td className="text-right">{money(l.balance)}</td>
                            </tr>
                          ))}
                          <tr className="font-semibold">
                            <td>{formatDay(statement.to)}</td>
                            <td colSpan={2}>Closing balance</td>
                            <td className="text-right">{money(statement.totalDebit)}</td>
                            <td className="text-right">{money(statement.totalCredit)}</td>
                            <td className="text-right" data-testid="closing-balance">
                              {money(statement.closingBalance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {statement.openMemos.length > 0 && (
                      <div className="text-sm">
                        <WholesaleStatusBadge tone="amendment">Credit available</WholesaleStatusBadge>{' '}
                        {statement.openMemos.map(m => `${memoLabel(m)} ${money(memoRemaining(m))}`).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {account && (
          <>
            <PaymentDialog
              open={paying}
              customerId={account.customerId}
              customerName={account.customerName}
              invoices={invoices}
              onClose={() => setPaying(false)}
              onDone={changed}
            />
            <ApplyMemoDialog memo={applying} invoices={invoices} onClose={() => setApplying(null)} onDone={changed} />
            <VoidMemoDialog memo={voiding} onClose={() => setVoiding(null)} onDone={changed} />
          </>
        )}
      </WsSheetContent>
    </Sheet>
  );
};
