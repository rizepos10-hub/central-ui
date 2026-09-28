import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { formatDay, toIsoDate } from '../closures/closure.model';
import { formatQty } from '../operations/operations.model';
import { ALL_FACTORIES, DayToolbar } from '../operations/day-toolbar';
import { money, signedMoney } from '../delivery/delivery.model';
import { useDeliveryUpdates } from '../delivery/delivery-socket';
import { StopDetailSheet } from '../delivery/stop-detail-sheet';
import { fetchReconciliation, fetchReconciliationRun } from './audits.api';
import { DISCREPANCY_LABEL, IMoney, IQuantities, IReconDay, IReconRun, IReconRunDetail } from './audits.model';

export const Stat = ({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'bad' | 'good' }) => (
  <div className="ws-card grid gap-0.5 px-4 py-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span
      className={cn('text-lg font-semibold', tone === 'bad' && 'text-destructive', tone === 'good' && 'text-[hsl(var(--ws-approved))]')}
      data-testid={`stat-${label}`}
    >
      {value}
    </span>
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
  </div>
);

const differenceTone = (value: number): 'bad' | undefined => (Math.abs(value) < 0.005 ? undefined : 'bad');

const handoverCell = (run: IReconRun) => {
  if (run.handoverClosed) {
    return Math.abs(run.money.cashDifference) < 0.005 ? (
      <WholesaleStatusBadge tone="approved">Matches</WholesaleStatusBadge>
    ) : (
      <WholesaleStatusBadge tone="returned">{signedMoney(run.money.cashDifference)}</WholesaleStatusBadge>
    );
  }
  return <WholesaleStatusBadge tone="neutral">{run.submitted ? 'Not counted' : 'Delivering'}</WholesaleStatusBadge>;
};

export const MoneyStats = ({ money: m, quantities: q }: { money: IMoney; quantities: IQuantities }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
    <Stat label="Invoiced" value={money(m.invoiced)} />
    <Stat label="Cash" value={money(m.cash)} />
    <Stat label="Checks" value={money(m.checks)} />
    <Stat label="On account" value={money(m.onAccount)} />
    <Stat label="Not paid" value={money(m.notPaid)} tone={m.notPaid > 0.005 ? 'bad' : undefined} />
    <Stat label="Stale credit" value={money(m.staleCredit)} hint={m.deliveryChangeCredit ? `+ ${money(m.deliveryChangeCredit)} delivery changes` : undefined} />
    <Stat label="Delivered" value={formatQty(q.delivered)} hint={`of ${formatQty(q.approved)} approved`} />
    <Stat label="Stale returned" value={formatQty(q.staleReturned)} />
  </div>
);

/** What was ordered, approved, delivered and paid per run of a day, with the handover difference and each unexplained change. */
const Reconciliation = () => {
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState(ALL_FACTORIES);
  const [day, setDay] = useState<IReconDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IReconRunDetail | null>(null);
  const [stopOrderId, setStopOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
  }, []);

  const dayRequest = useRef(0);
  const loadDay = useCallback(async () => {
    const current = ++dayRequest.current;
    try {
      const result = await fetchReconciliation(date, factoryId === ALL_FACTORIES ? null : factoryId);
      if (current !== dayRequest.current) return;
      setDay(result);
      setSelectedId(prev => (prev && result.runs.some(r => r.runId === prev) ? prev : null));
    } catch (error) {
      if (current !== dayRequest.current) return;
      setDay(null);
      toast.error(wholesaleErrorMessage(error, 'The reconciliation could not be loaded.'));
    } finally {
      if (current === dayRequest.current) setLoading(false);
    }
  }, [date, factoryId]);

  const detailRequest = useRef(0);
  const loadDetail = useCallback(async () => {
    const current = ++detailRequest.current;
    if (!selectedId) {
      setDetail(null);
      return;
    }
    try {
      const result = await fetchReconciliationRun(selectedId);
      if (current === detailRequest.current) setDetail(result);
    } catch (error) {
      if (current === detailRequest.current) toast.error(wholesaleErrorMessage(error, 'The run could not be loaded.'));
    }
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    loadDay();
  }, [loadDay]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useDeliveryUpdates(event => {
    if (event?.deliveryDate && event.deliveryDate !== date) return;
    loadDay();
    if (!event || event.runId === selectedId) loadDetail();
  });

  const factoryName = (id?: string | null) => factories.find(f => f.id === id)?.name ?? 'Factory';
  const runs = day?.runs ?? [];
  const total = day?.total;
  const selected = detail?.run.runId === selectedId ? detail : null;

  return (
    <WholesalePage title="Reconciliation" context={`What was ordered, delivered and paid on ${formatDay(date)}`}>
      <DayToolbar date={date} onDateChange={setDate} factories={factories} factoryId={factoryId} onFactoryChange={setFactoryId} allowAllFactories />

      {total && total.runs > 0 && (
        <>
          <MoneyStats money={total.money} quantities={total.quantities} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Runs submitted" value={`${runs.filter(r => r.submitted).length} / ${total.runs}`} hint={`${total.stopsDone} of ${total.stopsTotal} stops done`} />
            <Stat label="Handovers closed" value={`${total.handoversClosed} / ${total.runs}`} hint={`${money(total.money.cashHandedIn)} handed in`} />
            <Stat label="Handover difference" value={signedMoney(total.money.cashDifference)} tone={differenceTone(total.money.cashDifference)} />
            <Stat
              label="Quantity changes"
              value={total.discrepancies}
              hint={total.unexplained > 0 ? `${total.unexplained} without a reason` : 'All explained'}
              tone={total.unexplained > 0 ? 'bad' : undefined}
            />
          </div>
        </>
      )}

      {factoryId === ALL_FACTORIES && (day?.factories ?? []).length > 1 && (
        <div className="ws-card overflow-x-auto">
          <table className="ws-table" data-testid="recon-factories">
            <thead>
              <tr>
                <th>Factory</th>
                <th className="text-right">Runs</th>
                <th className="text-right">Delivered</th>
                <th className="text-right">Invoiced</th>
                <th className="text-right">Cash</th>
                <th className="text-right">Checks</th>
                <th className="text-right">Not paid</th>
                <th className="text-right">Difference</th>
              </tr>
            </thead>
            <tbody>
              {day.factories.map(f => (
                <tr key={f.factoryId ?? 'none'}>
                  <td className="font-medium">{factoryName(f.factoryId)}</td>
                  <td className="text-right">{f.runs}</td>
                  <td className="text-right">{formatQty(f.quantities.delivered)}</td>
                  <td className="text-right">{money(f.money.invoiced)}</td>
                  <td className="text-right">{money(f.money.cash)}</td>
                  <td className="text-right">{money(f.money.checks)}</td>
                  <td className="text-right">{money(f.money.notPaid)}</td>
                  <td className="text-right">{signedMoney(f.money.cashDifference)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ws-card overflow-x-auto">
        <table className="ws-table" data-testid="recon-runs">
          <thead>
            <tr>
              <th>Run</th>
              <th>Driver</th>
              <th className="text-right">Stops</th>
              <th className="text-right">Approved</th>
              <th className="text-right">Delivered</th>
              <th className="text-right">Stale</th>
              <th className="text-right">Invoiced</th>
              <th className="text-right">Cash</th>
              <th className="text-right">Checks</th>
              <th className="text-right">On account</th>
              <th className="text-right">Not paid</th>
              <th>Handover</th>
              <th className="text-right">Changes</th>
            </tr>
          </thead>
          <tbody>
            {runs.map(r => (
              <tr
                key={r.runId}
                className={cn('cursor-pointer', r.runId === selectedId && 'bg-accent')}
                onClick={() => setSelectedId(prev => (prev === r.runId ? null : r.runId))}
              >
                <td className="font-medium">{r.runName ?? 'Run'}</td>
                <td>{r.driverUsername ?? <span className="text-muted-foreground">No driver</span>}</td>
                <td className="text-right">
                  {r.stopsDone} / {r.stopsTotal}
                </td>
                <td className="text-right">{formatQty(r.quantities.approved)}</td>
                <td className="text-right">{formatQty(r.quantities.delivered)}</td>
                <td className="text-right">{r.quantities.staleReturned ? formatQty(r.quantities.staleReturned) : ''}</td>
                <td className="text-right">{money(r.money.invoiced)}</td>
                <td className="text-right">{money(r.money.cash)}</td>
                <td className="text-right">{money(r.money.checks)}</td>
                <td className="text-right">{money(r.money.onAccount)}</td>
                <td className={cn('text-right', r.money.notPaid > 0.005 && 'text-destructive')}>{money(r.money.notPaid)}</td>
                <td>{handoverCell(r)}</td>
                <td className="text-right">
                  {r.unexplained > 0 ? (
                    <WholesaleStatusBadge tone="returned">{r.unexplained} no reason</WholesaleStatusBadge>
                  ) : r.discrepancies > 0 ? (
                    r.discrepancies
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={13} className="py-8 text-center text-muted-foreground">
                  {loading ? 'Loading...' : `No runs for ${formatDay(date)}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="grid gap-4 lg:grid-cols-2" data-testid="recon-detail">
          <div className="ws-card overflow-x-auto">
            <h2 className="m-0 px-4 pt-3 text-base font-semibold">{selected.run.runName ?? 'Run'}: products</h2>
            {(selected.run.missingCheckNumbers ?? []).length > 0 && (
              <div className="mx-4 mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Checks not handed in: {selected.run.missingCheckNumbers.map(n => `#${n}`).join(', ')}
              </div>
            )}
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Ordered</th>
                  <th className="text-right">Approved</th>
                  <th className="text-right">Delivered</th>
                  <th className="text-right">Stale</th>
                </tr>
              </thead>
              <tbody>
                {selected.products.map(p => (
                  <tr key={`${p.itemId}-${p.variantId ?? ''}`}>
                    <td>{p.name ?? p.itemId}</td>
                    <td className="text-right">{formatQty(p.ordered)}</td>
                    <td className="text-right">{formatQty(p.approved)}</td>
                    <td className={cn('text-right', Math.abs(p.delivered - p.approved) > 0.0001 && 'font-semibold')}>{formatQty(p.delivered)}</td>
                    <td className="text-right">{p.staleReturned ? formatQty(p.staleReturned) : ''}</td>
                  </tr>
                ))}
                {selected.products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Nothing delivered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ws-card overflow-x-auto">
            <h2 className="m-0 px-4 pt-3 text-base font-semibold">Quantity changes</h2>
            <table className="ws-table" data-testid="recon-discrepancies">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th className="text-right">Change</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {selected.discrepancies.map(d => (
                  <tr key={`${d.orderId}-${d.itemId}-${d.variantId ?? ''}`} className="cursor-pointer" onClick={() => setStopOrderId(d.orderId)}>
                    <td className="font-semibold">{d.stopSequence ?? ''}</td>
                    <td>{d.customerName}</td>
                    <td>{d.name ?? d.itemId}</td>
                    <td className="text-right ws-mono">
                      {d.difference > 0 ? '+' : ''}
                      {formatQty(d.difference)}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({formatQty(d.delivered)} of {formatQty(d.approved)})
                      </span>
                    </td>
                    <td>
                      {d.reason ? <span className="mr-2">{d.reason}</span> : null}
                      <WholesaleStatusBadge tone={DISCREPANCY_LABEL[d.type].tone}>{DISCREPANCY_LABEL[d.type].label}</WholesaleStatusBadge>
                    </td>
                  </tr>
                ))}
                {selected.discrepancies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Everything was delivered as approved.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StopDetailSheet runId={selectedId} orderId={stopOrderId} onClose={() => setStopOrderId(null)} />
    </WholesalePage>
  );
};

export default Reconciliation;
