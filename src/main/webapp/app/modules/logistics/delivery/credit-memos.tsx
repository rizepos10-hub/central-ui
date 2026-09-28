import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsDialogContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { formatDay, formatRange } from '../closures/closure.model';
import { formatQty, formatTime } from '../operations/operations.model';
import { fetchCreditMemo, fetchCreditMemos } from './delivery.api';
import { ICreditFilters, IMemoDetail, IMemoRow, MEMO_REASON_LABEL, MEMO_STATUS_LABEL, MemoReason, MemoStatus, STALE_REASON_LABEL, StaleReason, money } from './delivery.model';
import { CreditFilterBar, FilterOption, SelectFilter, lastWeek, optionsFrom } from './credit-filters';

const memoNumber = (memo?: IMemoRow | null) => (memo?.number != null ? `#${memo.number}` : 'Credit memo');

/** Totals leave void memos out: they no longer credit anything. */
export const memoTotals = (memos: IMemoRow[]) => {
  const counted = memos.filter(m => m.status !== 'VOID');
  const sum = (list: IMemoRow[]) => Math.round(list.reduce((total, m) => total + (m.total ?? 0), 0) * 100) / 100;
  return { count: counted.length, total: sum(counted), open: sum(counted.filter(m => m.status === 'OPEN')) };
};

const lineReason = (reason?: string | null) => (reason && reason in STALE_REASON_LABEL ? STALE_REASON_LABEL[reason as StaleReason] : (reason ?? ''));

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="ws-card grid gap-0.5 px-4 py-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-lg font-semibold" data-testid={`stat-${label}`}>
      {value}
    </span>
  </div>
);

/** Credit owed to customers for delivery changes on issued invoices and for stale returns; applying them comes later. */
const CreditMemos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ICreditFilters>(() => lastWeek());
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [memos, setMemos] = useState<IMemoRow[]>([]);
  const [customers, setCustomers] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<IMemoDetail | null>(null);
  const openId = searchParams.get('memo');

  useEffect(() => {
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    try {
      const result = await fetchCreditMemos(filters);
      if (current !== request.current) return;
      setMemos(result);
      if (!filters.customerId) setCustomers(optionsFrom(result, m => m.customerId, m => m.customerName));
    } catch (error) {
      if (current !== request.current) return;
      setMemos([]);
      toast.error(wholesaleErrorMessage(error, 'The credit memos could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!openId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetchCreditMemo(openId)
      .then(result => !cancelled && setDetail(result))
      .catch(error => !cancelled && toast.error(wholesaleErrorMessage(error, 'The credit memo could not be loaded.')));
    return () => {
      cancelled = true;
    };
  }, [openId]);

  const open = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('memo', id);
    else next.delete('memo');
    setSearchParams(next, { replace: true });
  };

  const routeName = (id?: string | null) => routes.find(r => r.id === id)?.name ?? '';
  const totals = memoTotals(memos);
  const memo = detail?.memo;
  const source = detail?.sourceInvoice;

  return (
    <WholesalePage title="Credit Memos" context={`Delivered ${formatRange(filters.from, filters.to)}`}>
      <CreditFilterBar filters={filters} onChange={setFilters} routes={routes} customers={customers}>
        <SelectFilter
          label="Reason"
          value={filters.reason}
          anyLabel="All reasons"
          options={(Object.keys(MEMO_REASON_LABEL) as MemoReason[]).map(r => ({ value: r, label: MEMO_REASON_LABEL[r] }))}
          onChange={reason => setFilters({ ...filters, reason: reason as MemoReason | null })}
        />
        <SelectFilter
          label="Status"
          value={filters.status}
          anyLabel="All statuses"
          options={(Object.keys(MEMO_STATUS_LABEL) as MemoStatus[]).map(s => ({ value: s, label: MEMO_STATUS_LABEL[s] }))}
          onChange={status => setFilters({ ...filters, status: status as MemoStatus | null })}
        />
      </CreditFilterBar>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Memos" value={totals.count} />
        <Stat label="Credit" value={money(totals.total)} />
        <Stat label="Still open" value={money(totals.open)} />
      </div>

      <div className="ws-card overflow-x-auto">
        <table className="ws-table" data-testid="memo-rows">
          <thead>
            <tr>
              <th>Memo</th>
              <th>Delivered</th>
              <th>Customer</th>
              <th>Route</th>
              <th>Reason</th>
              <th>Invoice</th>
              <th>Status</th>
              <th className="text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {memos.map(m => (
              <tr key={m.id} className="cursor-pointer" onClick={() => open(m.id)}>
                <td className="ws-mono">{memoNumber(m)}</td>
                <td className="whitespace-nowrap">{formatDay(m.deliveryDate)}</td>
                <td className="font-medium">{m.customerName}</td>
                <td>{routeName(m.routeDefinitionId)}</td>
                <td>{m.reason ? MEMO_REASON_LABEL[m.reason] : '-'}</td>
                <td onClick={e => e.stopPropagation()}>
                  {m.orderId ? (
                    <Link to={`/order/${m.orderId}`} className="text-primary hover:underline">
                      {m.invoiceNumber != null ? `#${m.invoiceNumber}` : 'Order'}
                    </Link>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <WholesaleStatusBadge status={m.status}>{m.status ? MEMO_STATUS_LABEL[m.status] : '-'}</WholesaleStatusBadge>
                </td>
                <td className="text-right font-semibold">{money(m.total)}</td>
              </tr>
            ))}
            {memos.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  {loading ? 'Loading credit memos...' : 'No credit memos for these filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={openId != null} onOpenChange={value => !value && open(null)}>
        <WsDialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {memoNumber(memo)} {memo?.customerName ? `for ${memo.customerName}` : ''}
            </DialogTitle>
            <DialogDescription>
              {memo
                ? [memo.reason && MEMO_REASON_LABEL[memo.reason], memo.deliveryDate && `delivered ${formatDay(memo.deliveryDate)}`, memo.createdAt && `created ${formatTime(memo.createdAt)}`]
                    .filter(Boolean)
                    .join(', ')
                : 'Loading...'}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid gap-4" data-testid="memo-detail">
              <div className="overflow-x-auto rounded-md border">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Quantity</th>
                      <th className="text-right">Credit per unit</th>
                      <th className="text-right">Credit</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((line, index) => (
                      <tr key={`${line.itemId}-${index}`}>
                        <td className="font-medium">{line.itemName ?? line.itemId}</td>
                        <td className="text-right">{formatQty(line.quantity)}</td>
                        <td className="text-right">{money(line.unitCredit)}</td>
                        <td className="text-right">{money(line.total)}</td>
                        <td className="text-muted-foreground">{lineReason(line.reason)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="font-semibold">
                        Total
                      </td>
                      <td className="text-right font-semibold">{money(memo.total)}</td>
                      <td>
                        <WholesaleStatusBadge status={memo.status}>{memo.status ? MEMO_STATUS_LABEL[memo.status] : '-'}</WholesaleStatusBadge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="grid gap-1 text-sm">
                <span className="font-semibold">Source invoice</span>
                {source?.invoiceNumber != null ? (
                  <span>
                    #{source.invoiceNumber}
                    {source.issuedAt ? `, issued ${formatTime(source.issuedAt)}` : ''}
                    {source.billTotal != null ? `, ${money(source.billTotal)}` : ''}
                  </span>
                ) : (
                  <span className="text-muted-foreground">The order was not invoiced when the memo was created.</span>
                )}
                {detail.note && <span className="text-muted-foreground">Note: {detail.note}</span>}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {(source?.orderId ?? memo?.orderId) && (
              <Button asChild variant="outline" className="ws-control">
                <Link to={`/order/${source?.orderId ?? memo.orderId}`}>Open order</Link>
              </Button>
            )}
            <Button className="ws-control" onClick={() => open(null)}>
              Close
            </Button>
          </DialogFooter>
        </WsDialogContent>
      </Dialog>
    </WholesalePage>
  );
};

export default CreditMemos;
