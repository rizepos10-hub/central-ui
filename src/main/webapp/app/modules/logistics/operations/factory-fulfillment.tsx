import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { formatDay, toIsoDate } from '../closures/closure.model';
import {
  approveFactoryOrder,
  fetchFactoryInbox,
  fetchFactoryOrder,
  returnFactoryOrder,
  updateProduction,
  updateRouteProgress,
} from './operations.api';
import {
  FACTORY_ORDER_STATUS_LABEL,
  IFactoryOrderDetail,
  IFactoryOrderSummary,
  ILineAvailability,
  PRODUCTION_STATUS_LABEL,
  ProductionStatus,
  SHORTAGE_REASONS,
  ShortageReason,
  TRACKABLE,
  factoryOrderTone,
  formatQty,
  hasShortage,
  lineKey,
  routeIdsOf,
  routeProgress,
  validateAvailability,
} from './operations.model';
import { FactoryOrderLines } from './factory-order-lines';
import { useFactoryUpdates } from './factory-socket';

const CHANNEL = 'WEB';

/** The factory's side: incoming orders, approve or return with what can be made, then production and loading progress. Updates live. */
const FactoryFulfillment = () => {
  const [inbox, setInbox] = useState<IFactoryOrderSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IFactoryOrderDetail | null>(null);
  const [answerState, setAnswerState] = useState<{ version: string; values: Record<string, ILineAvailability> }>({ version: '', values: {} });
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = toIsoDate(new Date());

  const loadInbox = useCallback(async () => {
    try {
      const list = await fetchFactoryInbox(today);
      setInbox(list);
      setSelectedId(prev => prev ?? list.find(o => o.status === 'SENT')?.id ?? list[0]?.id ?? null);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The orders could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [today]);

  const detailRequest = useRef(0);
  const loadDetail = useCallback(async () => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const current = ++detailRequest.current;
    try {
      const result = await fetchFactoryOrder(selectedId);
      if (current === detailRequest.current) setDetail(result);
    } catch (error) {
      if (current === detailRequest.current) toast.error(wholesaleErrorMessage(error, 'The order could not be loaded.'));
    }
  }, [selectedId]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const order = detail?.order;
  const orderVersion = order ? `${order.id}:${order.version}` : '';
  const answers = answerState.version === orderVersion ? answerState.values : {};
  const setAnswers = (update: (prev: Record<string, ILineAvailability>) => Record<string, ILineAvailability>) =>
    setAnswerState(prev => ({ version: orderVersion, values: update(prev.version === orderVersion ? prev.values : {}) }));

  useEffect(() => {
    setNote('');
    setSubmitted(false);
  }, [orderVersion]);

  const factoryIds = useMemo(() => Array.from(new Set(inbox.map(o => o.factoryId))), [inbox]);
  useFactoryUpdates(factoryIds, event => {
    loadInbox();
    if (!event || event.id === selectedId) loadDetail();
    if (event?.action === 'SENT' || event?.action === 'RESUBMITTED' || event?.action === 'AMENDED') {
      toast.info(`New version for ${formatDay(event.deliveryDate)}`);
    }
  });

  const apply = (updated: IFactoryOrderDetail, message: string) => {
    setDetail(updated);
    toast.success(message);
    loadInbox();
  };

  const act = async (work: () => Promise<IFactoryOrderDetail>, message: string, failure: string) => {
    setBusy(true);
    try {
      apply(await work(), message);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, failure));
      if (error?.response?.status === 409) loadDetail();
    } finally {
      setBusy(false);
    }
  };

  const errors = order ? validateAvailability(order.lines, answers) : {};
  const short = order ? hasShortage(order.lines, answers) : false;

  const answer = () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    if (short) {
      act(
        () => returnFactoryOrder(order.id, order.version, CHANNEL, Object.values(answers), note.trim()),
        'Returned to the office with the shortages',
        'The order could not be returned.',
      );
    } else {
      act(() => approveFactoryOrder(order.id, order.version, CHANNEL, note.trim()), 'Order approved', 'The order could not be approved.');
    }
  };

  const setAvailable = (line: (typeof order.lines)[number], value: string) =>
    setAnswers(prev => ({
      ...prev,
      [lineKey(line)]: {
        itemId: line.itemId,
        variantId: line.variantId ?? null,
        availableQty: value === '' ? NaN : Number(value),
        reason: prev[lineKey(line)]?.reason ?? null,
      },
    }));

  const setReason = (line: (typeof order.lines)[number], reason: ShortageReason) =>
    setAnswers(prev => ({ ...prev, [lineKey(line)]: { ...prev[lineKey(line)], reason } }));

  const renderAnswer = (line: (typeof order.lines)[number]) => {
    const current = answers[lineKey(line)];
    const isLess = current != null && current.availableQty < (line.requestedQty ?? 0);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min={0}
          max={line.requestedQty ?? undefined}
          step="any"
          className="ws-control w-24"
          aria-label={`Can make ${line.itemName}`}
          value={current == null ? String(line.requestedQty ?? '') : Number.isNaN(current.availableQty) ? '' : String(current.availableQty)}
          onChange={e => setAvailable(line, e.target.value)}
        />
        {isLess && (
          <Select value={current.reason ?? undefined} onValueChange={value => setReason(line, value as ShortageReason)}>
            <SelectTrigger className="ws-control w-44" aria-label={`Why ${line.itemName} is short`}>
              <SelectValue placeholder="Why?" />
            </SelectTrigger>
            <WsSelectContent>
              {SHORTAGE_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </WsSelectContent>
          </Select>
        )}
        {submitted && errors[lineKey(line)] && <span className="text-xs text-destructive">{errors[lineKey(line)]}</span>}
      </div>
    );
  };

  const renderProduction = (line: (typeof order.lines)[number]) => (
    <Select
      value={line.productionStatus ?? 'NOT_STARTED'}
      onValueChange={value =>
        act(
          () => updateProduction(order.id, CHANNEL, { itemId: line.itemId, variantId: line.variantId ?? null, status: value as ProductionStatus }),
          `${line.itemName}: ${PRODUCTION_STATUS_LABEL[value as ProductionStatus].toLowerCase()}`,
          'The production status could not be saved.',
        )
      }
      disabled={busy || order.status === 'APPROVED'}
    >
      <SelectTrigger className="ws-control w-36" aria-label={`Production of ${line.itemName}`}>
        <SelectValue />
      </SelectTrigger>
      <WsSelectContent>
        {(Object.keys(PRODUCTION_STATUS_LABEL) as ProductionStatus[]).map(status => (
          <SelectItem key={status} value={status}>
            {PRODUCTION_STATUS_LABEL[status]}
          </SelectItem>
        ))}
      </WsSelectContent>
    </Select>
  );

  const tracking = order != null && TRACKABLE.includes(order.status);

  return (
    <WholesalePage title="Factory Fulfillment" context="Orders from the ordering center, from today on">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="ws-card overflow-hidden" data-testid="factory-inbox">
          {inbox.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelectedId(o.id)}
              className={cn('flex w-full flex-col gap-1 border-b px-4 py-3 text-left last:border-b-0', o.id === selectedId && 'bg-accent')}
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold">{formatDay(o.deliveryDate)}</span>
                <span className="text-xs text-muted-foreground">v{o.version}</span>
                <span className="flex-1" />
                <WholesaleStatusBadge tone={factoryOrderTone(o.status)}>{FACTORY_ORDER_STATUS_LABEL[o.status]}</WholesaleStatusBadge>
              </span>
              <span className="text-xs text-muted-foreground">
                {o.factoryName}, {o.lineCount} products, {formatQty(o.requestedTotal)} units, {o.routeCount} routes
              </span>
            </button>
          ))}
          {inbox.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">{loading ? 'Loading...' : 'No orders from today on.'}</div>
          )}
        </div>

        {order ? (
          <div className="grid content-start gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-lg font-semibold">
                {detail.factoryName}, {formatDay(order.deliveryDate)}
              </h2>
              <span className="text-muted-foreground">v{order.version}</span>
              <WholesaleStatusBadge tone={factoryOrderTone(order.status)}>{FACTORY_ORDER_STATUS_LABEL[order.status]}</WholesaleStatusBadge>
              <div className="flex-1" />
              {order.status === 'APPROVED' && (
                <Button
                  className="ws-control"
                  disabled={busy}
                  onClick={() => act(() => updateProduction(order.id, CHANNEL), 'Production started', 'Production could not be started.')}
                >
                  Start production
                </Button>
              )}
            </div>

            {order.status === 'SENT' && order.history?.length > 0 && order.history[order.history.length - 1].note && (
              <div className="ws-card px-4 py-2 text-sm">
                <span className="font-semibold">Note from the office: </span>
                {order.history[order.history.length - 1].note}
              </div>
            )}

            <FactoryOrderLines
              order={order}
              routeNames={detail.routeNames}
              renderAction={order.status === 'SENT' ? renderAnswer : tracking ? renderProduction : undefined}
              actionHeader={order.status === 'SENT' ? 'Can make' : 'Production'}
            />

            {order.status === 'SENT' && (
              <div className="ws-card grid gap-3 p-4">
                <Textarea aria-label="Note to the office" placeholder="Note to the office (optional)" rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} />
                <div className="flex justify-end">
                  <Button className="ws-control" disabled={busy} onClick={answer}>
                    {short ? 'Return with shortages' : `Approve version ${order.version}`}
                  </Button>
                </div>
              </div>
            )}

            {order.status === 'RETURNED' && (
              <div className="ws-card px-4 py-3 text-sm text-muted-foreground">Returned. The office is covering the shortages and will send a new version.</div>
            )}

            {tracking && (
              <div className="ws-card overflow-x-auto" data-testid="route-progress">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {routeIdsOf(order).map(routeId => {
                      const progress = routeProgress(order, routeId);
                      const name = detail.routeNames[routeId] ?? 'Route';
                      return (
                        <tr key={routeId}>
                          <td className="font-medium">{name}</td>
                          <td>
                            <WholesaleStatusBadge tone={progress.ready ? 'approved' : 'neutral'}>
                              {progress.dispatched ? 'Dispatched' : progress.ready ? 'Ready' : 'Not ready'}
                            </WholesaleStatusBadge>
                          </td>
                          <td className="whitespace-nowrap text-right">
                            {!progress.ready && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="ws-control"
                                disabled={busy}
                                onClick={() =>
                                  act(() => updateRouteProgress(order.id, CHANNEL, routeId, true, false), `${name} is ready`, 'The route could not be updated.')
                                }
                              >
                                Ready
                              </Button>
                            )}
                            {!progress.dispatched && (
                              <Button
                                size="sm"
                                className="ws-control ml-2"
                                disabled={busy}
                                onClick={() =>
                                  act(() => updateRouteProgress(order.id, CHANNEL, routeId, true, true), `${name} dispatched`, 'The route could not be updated.')
                                }
                              >
                                Dispatched
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="ws-card px-4 py-8 text-center text-sm text-muted-foreground">Choose an order.</div>
        )}
      </div>
    </WholesalePage>
  );
};

export default FactoryFulfillment;
