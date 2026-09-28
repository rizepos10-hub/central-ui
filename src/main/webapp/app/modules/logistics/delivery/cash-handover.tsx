import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'react-toastify';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsAlertDialogContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge, WholesaleStatusTone } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { fetchDrivers } from '../route-definitions/route-definition.api';
import { IWholesaleDriver, driverName } from '../route-definitions/route-definition.model';
import { formatDay, toIsoDate } from '../closures/closure.model';
import { formatTime } from '../operations/operations.model';
import { ALL_FACTORIES, DayToolbar } from '../operations/day-toolbar';
import { closeHandover, fetchHandover, fetchHandovers } from './delivery.api';
import { IHandoverDetail, IHandoverRow, OUTCOME_LABEL, differenceTone, handoverPreview, money, signedMoney } from './delivery.model';
import { useDeliveryUpdates } from './delivery-socket';

const MAX_NOTE = 1000;

const differenceClass = {
  even: 'text-[hsl(var(--ws-approved))] bg-[hsl(var(--ws-approved)/0.12)]',
  short: 'text-destructive bg-destructive/10',
  over: 'text-[hsl(var(--ws-amendment))] bg-[hsl(var(--ws-amendment)/0.12)]',
};

const differenceLabel = (value?: number | null) => {
  const tone = differenceTone(value);
  if (value == null) return '-';
  return tone === 'even' ? 'Matches' : `${signedMoney(value)} ${tone === 'short' ? 'short' : 'over'}`;
};

const Difference = ({ value, className }: { value?: number | null; className?: string }) => (
  <span data-testid="cash-difference" className={cn('inline-flex rounded-md px-2 py-0.5 font-semibold', differenceClass[differenceTone(value)], className)}>
    {differenceLabel(value)}
  </span>
);

const rowState = (row: IHandoverRow): { label: string; tone: WholesaleStatusTone } => {
  if (row.closed) return { label: 'Closed', tone: 'approved' };
  if (row.runSubmitted) return { label: 'Ready to count', tone: 'new' };
  return { label: 'Still delivering', tone: 'neutral' };
};

const Amount = ({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) => (
  <div className="flex items-baseline justify-between gap-3 border-b py-1.5 text-sm last:border-b-0">
    <span className="text-muted-foreground">{label}</span>
    <span className={strong ? 'font-semibold' : undefined}>{value}</span>
  </div>
);

/** The bookkeeper's count per run: what the driver should hand in against what they did, then the handover is closed for good. */
const CashHandover = () => {
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState(ALL_FACTORIES);
  const [drivers, setDrivers] = useState<IWholesaleDriver[]>([]);
  const [rows, setRows] = useState<IHandoverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IHandoverDetail | null>(null);

  const [cash, setCash] = useState('');
  const [checks, setChecks] = useState<string[]>([]);
  const [baskets, setBaskets] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
    fetchDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]));
  }, []);

  const listRequest = useRef(0);
  const loadRows = useCallback(async () => {
    const current = ++listRequest.current;
    try {
      const result = await fetchHandovers(date, factoryId === ALL_FACTORIES ? null : factoryId);
      if (current !== listRequest.current) return;
      setRows(result);
      setSelectedId(prev => (prev && result.some(r => r.runId === prev) ? prev : (result.find(r => r.runSubmitted && !r.closed) ?? result[0])?.runId ?? null));
    } catch (error) {
      if (current !== listRequest.current) return;
      setRows([]);
      toast.error(wholesaleErrorMessage(error, 'The handovers could not be loaded.'));
    } finally {
      if (current === listRequest.current) setLoading(false);
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
      const result = await fetchHandover(selectedId);
      if (current === detailRequest.current) setDetail(result);
    } catch (error) {
      if (current === detailRequest.current) toast.error(wholesaleErrorMessage(error, 'The handover could not be loaded.'));
    }
  }, [selectedId]);

  useEffect(() => {
    setLoading(true);
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setCash('');
    setBaskets('');
    setNote('');
    setSubmitted(false);
  }, [selectedId]);

  const expectedChecks = detail?.row.expected.checks ?? [];
  const checksKey = expectedChecks.map(c => c.checkNumber).join('|');
  useEffect(() => {
    setChecks(expectedChecks.map(c => c.checkNumber).filter(Boolean));
  }, [selectedId, checksKey]);

  useDeliveryUpdates(event => {
    if (event?.deliveryDate && event.deliveryDate !== date) return;
    loadRows();
    if (!event || event.runId === selectedId) loadDetail();
  });

  const driverLabel = (row: IHandoverRow) =>
    row.driverUserId ? driverName(drivers.find(d => d.id === row.driverUserId)) || row.driverUsername || 'Driver' : 'No driver';

  const row = detail?.row;
  const expected = row?.expected;
  const cashValue = cash.trim() === '' ? null : Number(cash);
  const preview = useMemo(() => (expected ? handoverPreview(expected, cashValue, checks) : null), [expected, cashValue, checks]);
  const cashError = cashValue == null || Number.isNaN(cashValue) || cashValue < 0 ? 'Enter the cash handed in' : null;
  const basketsValue = baskets.trim() === '' ? null : Number(baskets);
  const basketsError = basketsValue != null && (!Number.isInteger(basketsValue) || basketsValue < 0) ? 'Enter a whole number' : null;
  const noteError = note.length > MAX_NOTE ? `Use at most ${MAX_NOTE} characters` : null;

  const askToClose = () => {
    setSubmitted(true);
    if (cashError || basketsError || noteError) return;
    setConfirming(true);
  };

  const close = async () => {
    setBusy(true);
    try {
      const result = await closeHandover(row.runId, { cashHandedIn: cashValue, checksHandedIn: checks, basketsHandedIn: basketsValue, note: note.trim() || null });
      setDetail(result);
      toast.success(`Handover for ${result.row.runName ?? 'the run'} closed`);
      loadRows();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The handover could not be closed.'));
      loadDetail();
    } finally {
      setBusy(false);
    }
  };

  const handover = detail?.handover;
  const canCount = row && row.runSubmitted && !row.closed;

  return (
    <WholesalePage title="Cash Handover" context={`Runs delivered on ${formatDay(date)}`}>
      <DayToolbar date={date} onDateChange={setDate} factories={factories} factoryId={factoryId} onFactoryChange={setFactoryId} allowAllFactories />

      <div className="ws-card overflow-x-auto">
        <table className="ws-table" data-testid="handover-list">
          <thead>
            <tr>
              <th>Run</th>
              <th>Driver</th>
              <th className="text-right">Stops</th>
              <th className="text-right">Cash</th>
              <th className="text-right">Checks</th>
              <th>Status</th>
              <th className="text-right">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const s = rowState(r);
              return (
                <tr key={r.runId} className={cn('cursor-pointer', r.runId === selectedId && 'bg-accent')} onClick={() => setSelectedId(r.runId)}>
                  <td className="font-medium">{r.runName ?? 'Run'}</td>
                  <td>{driverLabel(r)}</td>
                  <td className="text-right">
                    {r.expected.stopsDone} / {r.expected.stopsTotal}
                  </td>
                  <td className="text-right">{money(r.expected.cash)}</td>
                  <td className="text-right">
                    {r.expected.checks.length > 0 ? `${r.expected.checks.length}, ${money(r.expected.checksTotal)}` : '-'}
                  </td>
                  <td>
                    <WholesaleStatusBadge tone={s.tone}>{s.label}</WholesaleStatusBadge>
                  </td>
                  <td className="text-right">{r.closed ? <Difference value={r.cashDifference} className="text-xs" /> : ''}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  {loading ? 'Loading handovers...' : `No runs for ${formatDay(date)}.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {row && expected && (
        <div className="grid gap-4 lg:grid-cols-2" data-testid="handover-detail">
          <div className="ws-card grid content-start gap-2 p-4">
            <h2 className="m-0 text-base font-semibold">
              {row.runName}, {driverLabel(row)}
            </h2>
            {!row.runSubmitted && (
              <div className="text-sm text-muted-foreground">
                The driver has not submitted this run yet. These are the totals of the {expected.stopsDone} of {expected.stopsTotal} stops done so far.
              </div>
            )}
            <div>
              <Amount label="Cash to hand in" value={money(expected.cash)} strong />
              <Amount label={`Checks (${expected.checks.length})`} value={money(expected.checksTotal)} strong />
              <Amount label="On account" value={money(expected.onAccount)} />
              <Amount label="Not paid" value={money(expected.notPaid)} />
              <Amount label="Stale credit" value={money(expected.staleCredit)} />
              <Amount label="Baskets returned" value={expected.basketsReturned} />
            </div>
          </div>

          <div className="ws-card grid content-start gap-3 p-4">
            {row.closed ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="m-0 text-base font-semibold">Closed</h2>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(row.closedAt ?? handover?.closedAt)} by {row.closedBy ?? handover?.closedBy ?? 'unknown'}
                  </span>
                </div>
                <div>
                  <Amount label="Cash handed in" value={money(row.cashHandedIn ?? handover?.cashHandedIn)} strong />
                  <Amount label="Difference" value={<Difference value={row.cashDifference ?? handover?.cashDifference} />} />
                  <Amount label="Checks handed in" value={(handover?.checksHandedIn ?? []).join(', ') || 'None'} />
                  <Amount label="Baskets handed in" value={handover?.basketsHandedIn ?? '-'} />
                </div>
                {(row.missingCheckNumbers ?? []).length > 0 && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Missing checks: {row.missingCheckNumbers.join(', ')}</div>
                )}
                {handover?.note && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Note: </span>
                    {handover.note}
                  </div>
                )}
              </>
            ) : (
              <fieldset disabled={!canCount || busy} className="grid gap-3">
                <h2 className="m-0 text-base font-semibold">Handed in</h2>
                <div className="grid gap-1.5">
                  <Label htmlFor="ws-handover-cash">Cash</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      id="ws-handover-cash"
                      type="number"
                      min={0}
                      step="0.01"
                      className="ws-control ws-mono w-36"
                      value={cash}
                      onChange={e => setCash(e.target.value)}
                    />
                    {preview?.cashDifference != null && <Difference value={preview.cashDifference} />}
                  </div>
                  {submitted && cashError && <span className="text-xs text-destructive">{cashError}</span>}
                </div>

                {expectedChecks.length > 0 && (
                  <div className="grid gap-1.5">
                    <Label>Checks</Label>
                    <div className="grid gap-1.5 rounded-md border p-2" role="group" aria-label="Checks handed in">
                      {expectedChecks.map(c => (
                        <label key={`${c.orderId}-${c.checkNumber}`} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checks.includes(c.checkNumber)}
                            onCheckedChange={on => setChecks(prev => (on === true ? [...prev, c.checkNumber] : prev.filter(n => n !== c.checkNumber)))}
                            disabled={!canCount || busy}
                            aria-label={`Check ${c.checkNumber}`}
                          />
                          <span className="ws-mono">#{c.checkNumber}</span>
                          <span className="text-muted-foreground">{c.customerName}</span>
                          <span className="flex-1" />
                          <span>{money(c.amount)}</span>
                        </label>
                      ))}
                    </div>
                    {(preview?.missingChecks ?? []).length > 0 && (
                      <span className="text-xs text-destructive">Missing: {preview.missingChecks.map(c => `#${c.checkNumber}`).join(', ')}</span>
                    )}
                  </div>
                )}

                <div className="grid gap-1.5">
                  <Label htmlFor="ws-handover-baskets">Baskets</Label>
                  <Input
                    id="ws-handover-baskets"
                    type="number"
                    min={0}
                    step={1}
                    className="ws-control ws-mono w-28"
                    placeholder={String(expected.basketsReturned)}
                    value={baskets}
                    onChange={e => setBaskets(e.target.value)}
                  />
                  {submitted && basketsError && <span className="text-xs text-destructive">{basketsError}</span>}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="ws-handover-note">Note</Label>
                  <Textarea id="ws-handover-note" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" />
                  {noteError && <span className="text-xs text-destructive">{noteError}</span>}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {!row.runSubmitted && <span className="mr-auto text-xs text-muted-foreground">Can be closed once the driver submits the run.</span>}
                  <Button className="ws-control" onClick={askToClose} disabled={!canCount || busy}>
                    Close handover
                  </Button>
                </div>
              </fieldset>
            )}
          </div>

          <div className="ws-card overflow-x-auto lg:col-span-2">
            <table className="ws-table">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Customer</th>
                  <th>Paid by</th>
                  <th className="text-right">Collected</th>
                  <th>Check</th>
                  <th className="text-right">Baskets</th>
                  <th className="text-right">Stale credit</th>
                  <th className="text-right">Not paid</th>
                </tr>
              </thead>
              <tbody>
                {detail.stops.map((stop, index) => (
                  <tr key={stop.orderId}>
                    <td className="font-semibold">{stop.sequence ?? index + 1}</td>
                    <td>{stop.customerName}</td>
                    <td>{stop.outcome ? OUTCOME_LABEL[stop.outcome] : <span className="text-muted-foreground">Not delivered</span>}</td>
                    <td className="text-right">{stop.outcome ? money(stop.amountCollected) : ''}</td>
                    <td className="ws-mono">{stop.checkNumber ?? ''}</td>
                    <td className="text-right">{stop.basketsReturned ?? ''}</td>
                    <td className="text-right">{stop.staleCredit ? money(stop.staleCredit) : ''}</td>
                    <td className="text-right">{stop.notPaid ? money(stop.notPaid) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <WsAlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close the handover for {row?.runName ?? 'this run'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {money(cashValue)} cash
              {preview?.cashDifference != null && Math.abs(preview.cashDifference) >= 0.005 ? ` (${differenceLabel(preview.cashDifference)})` : ''}, {checks.length}{' '}
              {checks.length === 1 ? 'check' : 'checks'}
              {(preview?.missingChecks ?? []).length > 0 ? `, ${preview.missingChecks.length} missing` : ''}. A closed handover can&apos;t be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="ws-control">Cancel</AlertDialogCancel>
            <AlertDialogAction className="ws-control" onClick={close}>
              Close handover
            </AlertDialogAction>
          </AlertDialogFooter>
        </WsAlertDialogContent>
      </AlertDialog>
    </WholesalePage>
  );
};

export default CashHandover;
