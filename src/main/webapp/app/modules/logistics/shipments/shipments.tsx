import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsDialogContent, WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { formatDay } from '../closures/closure.model';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { formatTime } from '../operations/operations.model';
import { NoteDialog } from '../operations/note-dialog';
import { money } from '../sales/sales.model';
import { fetchSettings } from '../settings/wholesale-settings.api';
import { IWholesaleCarrier } from '../settings/wholesale-settings.model';
import { isLiveSource } from '../shipping/shipping.model';
import { deliverOrder, fetchShipments, shipOrder } from './shipments.api';
import { FeeDialog, LabelChoice, ShippingCell } from './shipping-fee';
import {
  DELIVERY_ROLES,
  IShipRequest,
  IShipmentRow,
  SHIPMENT_STAGES,
  SHIPPER_ROLES,
  STAGE_LABEL,
  STAGE_TONE,
  ShipmentStage,
  isStage,
  shipmentErrors,
} from './shipments.model';

const ALL = '__all';
const NONE = '__none';

const ShipDialog = ({
  row,
  carriers,
  onClose,
  onShipped,
}: {
  row: IShipmentRow | null;
  carriers: IWholesaleCarrier[];
  onClose: () => void;
  onShipped: (row: IShipmentRow) => void;
}) => {
  const [request, setRequest] = useState<IShipRequest>({ carrierId: null, trackingNumber: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [buyLabel, setBuyLabel] = useState(false);
  const active = carriers.filter(c => c.id && c.active !== false);
  const provider = isLiveSource(row?.shipping?.source) ? row.shipping.source : null;

  useEffect(() => {
    if (row) {
      const preset = row.carrierId && active.some(c => c.id === row.carrierId) ? row.carrierId : active.length === 1 ? active[0].id : null;
      setRequest({ carrierId: preset, trackingNumber: '', notes: '' });
      setSubmitted(false);
      setBuyLabel(isLiveSource(row.shipping?.source));
    }
  }, [row]);

  const errors = buyLabel ? {} : shipmentErrors(request);
  const shown = submitted ? errors : {};

  const ship = async () => {
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      const notes = request.notes?.trim() || null;
      onShipped(
        await shipOrder(
          row.orderId,
          buyLabel ? { carrierId: null, trackingNumber: '', notes } : { ...request, trackingNumber: request.trackingNumber.trim(), notes }
        )
      );
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The order could not be shipped.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={row != null} onOpenChange={open => !open && !busy && onClose()}>
      <WsDialogContent>
        <DialogHeader>
          <DialogTitle>Ship order {row?.sequenceNumber ?? ''}</DialogTitle>
          <DialogDescription>
            {row?.customerName} / {row?.factoryName}
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={busy} className="grid gap-3">
          {provider && (
            <LabelChoice provider={provider} quote={row.shipping} buyLabel={buyLabel} onChange={setBuyLabel} />
          )}
          <div className={cn('grid gap-1.5', buyLabel && 'hidden')}>
            <Label>Carrier</Label>
            <Select
              value={request.carrierId ?? NONE}
              onValueChange={value => setRequest(prev => ({ ...prev, carrierId: value === NONE ? null : value }))}
            >
              <SelectTrigger className="ws-control" aria-label="Carrier">
                <SelectValue />
              </SelectTrigger>
              <WsSelectContent>
                <SelectItem value={NONE}>Choose a carrier</SelectItem>
                {active.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </WsSelectContent>
            </Select>
            {shown.carrierId && <span className="text-xs text-destructive">{shown.carrierId}</span>}
            {active.length === 0 && <span className="text-xs text-destructive">No active carriers. Add one in Wholesale Settings.</span>}
          </div>
          <div className={cn('grid gap-1.5', buyLabel && 'hidden')}>
            <Label htmlFor="ws-tracking-number">Tracking number</Label>
            <Input
              id="ws-tracking-number"
              className="ws-control ws-mono"
              maxLength={200}
              value={request.trackingNumber}
              onChange={e => setRequest(prev => ({ ...prev, trackingNumber: e.target.value }))}
            />
            {shown.trackingNumber && <span className="text-xs text-destructive">{shown.trackingNumber}</span>}
          </div>
          <Textarea
            aria-label="Note"
            placeholder="Note (optional)"
            rows={2}
            maxLength={200}
            value={request.notes ?? ''}
            onChange={e => setRequest(prev => ({ ...prev, notes: e.target.value }))}
          />
        </fieldset>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="ws-control" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button className="ws-control" onClick={ship} disabled={busy}>
            {busy ? (buyLabel ? 'Buying label...' : 'Working...') : buyLabel ? 'Buy label and ship' : 'Ship'}
          </Button>
        </DialogFooter>
      </WsDialogContent>
    </Dialog>
  );
};

/** Orders on carrier routes: waiting for the factory, ready to ship, with the carrier, and delivered. */
const Shipments = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canShip = hasAnyAuthority(authorities, SHIPPER_ROLES);
  const canDeliver = hasAnyAuthority(authorities, DELIVERY_ROLES);

  const [params, setParams] = useSearchParams();
  const stageParam = params.get('stage');
  const stage: ShipmentStage = isStage(stageParam) ? stageParam : 'READY';
  const factoryId = params.get('factoryId') || ALL;

  const [rows, setRows] = useState<IShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [carriers, setCarriers] = useState<IWholesaleCarrier[]>([]);
  const [shipping, setShipping] = useState<IShipmentRow | null>(null);
  const [delivering, setDelivering] = useState<IShipmentRow | null>(null);
  const [feeRow, setFeeRow] = useState<IShipmentRow | null>(null);

  useEffect(() => {
    fetchFactories()
      .then(setFactories)
      .catch(() => setFactories([]));
    fetchSettings()
      .then(settings => setCarriers(settings.carriers ?? []))
      .catch(() => setCarriers([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    try {
      const list = await fetchShipments({ stage, factoryId: factoryId === ALL ? undefined : factoryId });
      if (current === request.current) setRows(list);
    } catch (error) {
      if (current !== request.current) return;
      setRows([]);
      toast.error(wholesaleErrorMessage(error, 'The shipments could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [stage, factoryId]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  const setFilter = (key: 'stage' | 'factoryId', value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const done = (message: string) => {
    toast.success(message);
    setShipping(null);
    setDelivering(null);
    load();
  };

  const deliver = async (note: string) => {
    try {
      await deliverOrder(delivering.orderId, note);
      done(`Order ${delivering.sequenceNumber ?? ''} delivered and charged to the account`);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The order could not be marked delivered.'));
    }
  };

  const empty = SHIPMENT_STAGES.find(s => s.value === stage)?.empty;

  return (
    <WholesalePage title="Shipments" context="Orders shipped by carrier">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full border bg-card" role="tablist" aria-label="Stage">
          {SHIPMENT_STAGES.map(s => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={stage === s.value}
              onClick={() => setFilter('stage', s.value === 'READY' ? null : s.value)}
              className={cn(
                'h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px]',
                stage === s.value && 'bg-accent font-semibold text-accent-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Select value={factoryId} onValueChange={value => setFilter('factoryId', value === ALL ? null : value)}>
          <SelectTrigger className="ws-control w-52" aria-label="Factory">
            <SelectValue />
          </SelectTrigger>
          <WsSelectContent>
            <SelectItem value={ALL}>All factories</SelectItem>
            {factories.map(f => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
              </SelectItem>
            ))}
          </WsSelectContent>
        </Select>
      </div>

      <div className="ws-card overflow-x-auto">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Factory</th>
              <th>Delivery date</th>
              <th>Stage</th>
              <th>Carrier</th>
              <th>Tracking</th>
              <th>Shipping</th>
              <th className="ws-num">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.orderId} data-testid={`shipment-${row.orderId}`}>
                <td className="ws-mono">{row.sequenceNumber ?? ''}</td>
                <td className="font-medium">{row.customerName}</td>
                <td>{row.factoryName}</td>
                <td>{formatDay(row.deliveryDate)}</td>
                <td>
                  <WholesaleStatusBadge tone={STAGE_TONE[row.stage]}>{STAGE_LABEL[row.stage]}</WholesaleStatusBadge>
                  {row.stage === 'SHIPPED' && row.shippedAt && (
                    <div className="text-xs text-muted-foreground">{formatTime(row.shippedAt)}</div>
                  )}
                  {row.stage === 'DELIVERED' && row.deliveredAt && (
                    <div className="text-xs text-muted-foreground">{formatTime(row.deliveredAt)}</div>
                  )}
                </td>
                <td>{row.carrierName ?? ''}</td>
                <td className="ws-mono">
                  {row.trackingUrl ? (
                    <a
                      href={row.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {row.trackingNumber}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    row.trackingNumber ?? ''
                  )}
                  {row.labelUrl && (
                    <a href={row.labelUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-primary hover:underline">
                      Label
                    </a>
                  )}
                </td>
                <td>
                  <ShippingCell quote={row.shipping} />
                </td>
                <td className="ws-num">{money(row.total)}</td>
                <td className="whitespace-nowrap text-right">
                  {canDeliver && (row.stage === 'READY' || row.stage === 'WAITING_FACTORY') && (
                    <Button size="sm" variant="outline" className="ws-control mr-2" onClick={() => setFeeRow(row)}>
                      Fee
                    </Button>
                  )}
                  {canShip && row.stage === 'READY' && (
                    <Button size="sm" className="ws-control" onClick={() => setShipping(row)}>
                      Ship
                    </Button>
                  )}
                  {canDeliver && row.stage === 'SHIPPED' && (
                    <Button size="sm" className="ws-control" onClick={() => setDelivering(row)}>
                      Delivered
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            )}
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-muted-foreground">
                  Loading shipments...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ShipDialog
        row={shipping}
        carriers={carriers}
        onClose={() => setShipping(null)}
        onShipped={saved => done(`Order ${saved.sequenceNumber ?? ''} shipped`)}
      />

      <FeeDialog row={feeRow} onClose={() => setFeeRow(null)} onSaved={load} />

      <NoteDialog
        open={delivering != null}
        title={delivering ? `Order ${delivering.sequenceNumber ?? ''} was delivered?` : ''}
        description={delivering && `${delivering.customerName} is billed ${money(delivering.total)} on account.`}
        confirmLabel="Mark delivered"
        onClose={() => setDelivering(null)}
        onConfirm={deliver}
      />
    </WholesalePage>
  );
};

export default Shipments;
