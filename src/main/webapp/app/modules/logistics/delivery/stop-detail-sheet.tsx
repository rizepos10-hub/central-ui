import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';

import { Sheet, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WsSheetContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { formatQty, formatTime } from '../operations/operations.model';
import { fetchStop } from './delivery.api';
import {
  IStopDetail,
  MEMO_REASON_LABEL,
  OUTCOME_LABEL,
  STALE_REASON_LABEL,
  expectedQty,
  lineChanged,
  mapLink,
  money,
  staleCredit,
  stopName,
} from './delivery.model';
import { useDeliveryUpdates } from './delivery-socket';

interface StopDetailSheetProps {
  runId: string | null;
  orderId: string | null;
  onClose: () => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{children}</span>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="grid gap-2">
    <h3 className="m-0 text-sm font-semibold">{title}</h3>
    {children}
  </section>
);

/** One stop as the driver recorded it: quantities against what was approved, payment, baskets, stale returns and proof. */
export const StopDetailSheet = ({ runId, orderId, onClose }: StopDetailSheetProps) => {
  const [detail, setDetail] = useState<IStopDetail | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    if (!runId || !orderId) return;
    const current = ++request.current;
    try {
      const result = await fetchStop(runId, orderId);
      if (current === request.current) setDetail(result);
    } catch (error) {
      if (current === request.current) toast.error(wholesaleErrorMessage(error, 'The stop could not be loaded.'));
    }
  }, [runId, orderId]);

  useEffect(() => {
    setDetail(null);
    load();
  }, [load]);

  useDeliveryUpdates(event => {
    if (runId && orderId && (!event || event.runId === runId)) load();
  });

  const open = runId != null && orderId != null;
  const stop = detail?.stop;
  const delivery = detail?.delivery;
  const done = stop?.status != null && stop.status !== 'PENDING';
  const stale = delivery?.staleReturns ?? [];
  const map = mapLink(delivery?.latitude, delivery?.longitude);

  return (
    <Sheet open={open} onOpenChange={value => !value && onClose()}>
      <WsSheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>
            {stop?.sequence != null && <span className="mr-1 text-muted-foreground">{stop.sequence}.</span>}
            {detail ? stopName(stop) : 'Loading stop...'}
          </SheetTitle>
          <SheetDescription>{[stop?.address, detail?.phone].filter(Boolean).join(' / ') || ' '}</SheetDescription>
        </SheetHeader>

        {detail && (
          <div className="mt-4 grid gap-5" data-testid="stop-detail">
            <div className="flex flex-wrap items-center gap-2">
              <WholesaleStatusBadge tone={done ? 'approved' : 'neutral'}>{done ? 'Delivered' : 'Not delivered yet'}</WholesaleStatusBadge>
              {delivery?.deliveredAt && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(delivery.deliveredAt)}
                  {delivery.deliveredBy ? ` by ${delivery.deliveredBy}` : ''}
                </span>
              )}
              <div className="flex-1" />
              <Link to={`/order/${orderId}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Open order <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {detail.orderNotes && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-semibold">Order notes: </span>
                {detail.orderNotes}
              </div>
            )}

            <Section title="Products">
              <div className="overflow-x-auto rounded-md border">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-right">Ordered</th>
                      <th className="text-right">Approved</th>
                      <th className="text-right">Delivered</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map(line => {
                      const changed = lineChanged(line);
                      return (
                        <tr key={`${line.itemId}|${line.variantId ?? ''}`}>
                          <td className="font-medium">{line.name}</td>
                          <td className="text-right">{formatQty(line.orderedAmount ?? line.amount)}</td>
                          <td className="text-right">{formatQty(line.approvedAmount ?? expectedQty(line))}</td>
                          <td className={cn('text-right font-semibold', changed && 'text-[hsl(var(--ws-returned))]')}>
                            {line.deliveredAmount == null ? '-' : formatQty(line.deliveredAmount)}
                          </td>
                          <td className="text-muted-foreground">{line.reason ?? ''}</td>
                        </tr>
                      );
                    })}
                    {detail.lines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-muted-foreground">
                          No products on this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Payment and baskets">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Paid by">{delivery?.outcome ? OUTCOME_LABEL[delivery.outcome] : '-'}</Field>
                <Field label="Collected">{delivery?.outcome ? money(delivery.amountCollected) : '-'}</Field>
                <Field label="Check number">{delivery?.checkNumber ?? '-'}</Field>
                <Field label="Baskets returned">{delivery?.basketsReturned ?? '-'}</Field>
                <Field label="Bill total">{money(detail.bill?.total)}</Field>
                <Field label="Paid">{money(detail.bill?.paid)}</Field>
                <Field label="Left to pay">{money(detail.bill?.remaining)}</Field>
                <Field label="Invoice">{detail.bill?.invoiceNumber != null ? `#${detail.bill.invoiceNumber}` : 'Not issued'}</Field>
              </div>
            </Section>

            {stale.length > 0 && (
              <Section title={`Stale returns, ${money(staleCredit(stale))} credit`}>
                <div className="overflow-x-auto rounded-md border">
                  <table className="ws-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Quantity</th>
                        <th>Reason</th>
                        <th className="text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stale.map((line, index) => (
                        <tr key={`${line.itemId}-${index}`}>
                          <td className="font-medium">{line.itemName ?? line.itemId}</td>
                          <td className="text-right">{formatQty(line.quantity)}</td>
                          <td>{line.reason ? STALE_REASON_LABEL[line.reason] : '-'}</td>
                          <td className="text-right">{money((line.unitCredit ?? 0) * (line.quantity ?? 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {done && (
              <Section title="Proof of delivery">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Signature">
                    {delivery?.signatureUrl ? (
                      <a href={delivery.signatureUrl} target="_blank" rel="noreferrer">
                        <img src={delivery.signatureUrl} alt="Customer signature" className="h-28 w-full rounded-md border bg-white object-contain" />
                      </a>
                    ) : (
                      'Not taken'
                    )}
                  </Field>
                  <Field label="Photo">
                    {delivery?.photoUrl ? (
                      <a href={delivery.photoUrl} target="_blank" rel="noreferrer">
                        <img src={delivery.photoUrl} alt="Delivery photo" className="h-28 w-full rounded-md border object-cover" />
                      </a>
                    ) : (
                      'Not taken'
                    )}
                  </Field>
                </div>
                <Field label="Location">
                  {map ? (
                    <a href={map} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <MapPin className="h-3.5 w-3.5" />
                      {delivery.latitude.toFixed(5)}, {delivery.longitude.toFixed(5)}
                      {delivery.locationAccuracy != null && <span className="text-muted-foreground">(within {Math.round(delivery.locationAccuracy)} m)</span>}
                    </a>
                  ) : (
                    <span>No location{delivery?.noLocationReason ? `: ${delivery.noLocationReason}` : ''}</span>
                  )}
                </Field>
                {delivery?.note && <Field label="Driver's note">{delivery.note}</Field>}
              </Section>
            )}

            {(detail.creditMemos ?? []).length > 0 && (
              <Section title="Credit memos">
                <ul className="m-0 grid gap-1 p-0 text-sm">
                  {detail.creditMemos.map(memo => (
                    <li key={memo.id} className="flex list-none items-center gap-2">
                      <span className="ws-mono">{memo.number != null ? `#${memo.number}` : '-'}</span>
                      <span>{memo.reason ? MEMO_REASON_LABEL[memo.reason] : ''}</span>
                      <span className="flex-1" />
                      <span className="font-semibold">{money(memo.total)}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </WsSheetContent>
    </Sheet>
  );
};

export default StopDetailSheet;
