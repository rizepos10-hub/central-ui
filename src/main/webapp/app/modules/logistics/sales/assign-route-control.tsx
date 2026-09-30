import React, { useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { assignOrderRoute } from './order-search.api';
import { IOrderRow, notifyOrdersChanged, orderLabel } from './order-search.model';

interface AssignRouteControlProps {
  row: IOrderRow;
  routes: IWholesaleRouteDefinition[];
  onAssigned: (row: IOrderRow) => void;
}

/** Puts an open order on a route for its delivery date, or moves it to another route. */
export const AssignRouteControl = ({ row, routes, onAssigned }: AssignRouteControlProps) => {
  const [editing, setEditing] = useState(false);
  const [routeId, setRouteId] = useState<string>(row.routeId ?? '');
  const [busy, setBusy] = useState(false);

  if (!row.routeChangeable) return null;
  const choices = routes.filter(r => r.active !== false && !r.carrierShipping);

  if (!editing) {
    return (
      <Button
        variant={row.routeId ? 'outline' : 'default'}
        size="sm"
        className="ws-control"
        onClick={() => {
          setRouteId(row.routeId ?? '');
          setEditing(true);
        }}
      >
        {row.routeId ? 'Change route' : 'Assign route'}
      </Button>
    );
  }

  const save = async () => {
    if (!routeId) return;
    setBusy(true);
    try {
      const updated = await assignOrderRoute(row.id, routeId);
      toast.success(`Order ${orderLabel(row)} is on ${updated.routeName ?? 'the route'}`);
      notifyOrdersChanged();
      onAssigned(updated);
      setEditing(false);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The route could not be changed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <Select value={routeId || undefined} onValueChange={setRouteId}>
        <SelectTrigger className="ws-control w-48" aria-label={`Route for order ${orderLabel(row)}`}>
          <SelectValue placeholder="Choose a route" />
        </SelectTrigger>
        <WsSelectContent>
          {choices.map(r => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
            </SelectItem>
          ))}
        </WsSelectContent>
      </Select>
      <Button size="sm" className="ws-control" onClick={save} disabled={busy || !routeId || routeId === row.routeId}>
        {busy ? 'Saving...' : 'Save'}
      </Button>
      <Button variant="outline" size="sm" className="ws-control" onClick={() => setEditing(false)} disabled={busy}>
        Back
      </Button>
    </span>
  );
};

export default AssignRouteControl;
