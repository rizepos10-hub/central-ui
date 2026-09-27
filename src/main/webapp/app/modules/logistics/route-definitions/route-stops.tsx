import React, { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical, MapPinOff, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { daysLabel } from '../customers/wholesale-customer.model';
import { IRouteMember, hasLocation, memberName } from './route-definition.model';

interface RouteStopsProps {
  stops: IRouteMember[];
  readOnly: boolean;
  /** Removing is blocked while the order has unsaved changes. */
  canRemove: boolean;
  onMove: (from: number, to: number) => void;
  onRemove: (member: IRouteMember) => void;
}

export const RouteStops = ({ stops, readOnly, canRemove, onMove, onRemove }: RouteStopsProps) => {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const drop = (to: number) => {
    if (dragging != null) onMove(dragging, to);
    setDragging(null);
    setOver(null);
  };

  if (stops.length === 0) {
    return <div className="py-8 text-center text-[13px] text-muted-foreground">No stops yet. Add wholesale customers to this route.</div>;
  }

  return (
    <ol className="divide-y" aria-label="Stops">
      {stops.map((stop, index) => (
        <li
          key={stop.customerId}
          draggable={!readOnly}
          onDragStart={e => {
            e.dataTransfer.effectAllowed = 'move';
            setDragging(index);
          }}
          onDragOver={e => {
            if (dragging == null) return;
            e.preventDefault();
            setOver(index);
          }}
          onDragLeave={() => setOver(prev => (prev === index ? null : prev))}
          onDrop={e => {
            e.preventDefault();
            drop(index);
          }}
          onDragEnd={() => {
            setDragging(null);
            setOver(null);
          }}
          className={cn(
            'flex h-[var(--ws-row-h)] items-center gap-2 px-2 text-[13px]',
            dragging === index && 'opacity-40',
            over === index && dragging !== index && 'bg-accent',
          )}
        >
          {!readOnly && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />}
          <span className="ws-mono w-6 shrink-0 text-right text-muted-foreground">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{memberName(stop)}</span>
            {stop.address && <span className="ml-2 text-muted-foreground">{stop.address}</span>}
          </span>
          <span className="hidden shrink-0 text-xs text-muted-foreground lg:inline">{daysLabel(stop.deliveryDays)}</span>
          {!hasLocation(stop) && (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[hsl(var(--ws-returned))]" title="The delivery address has no coordinates">
              <MapPinOff className="h-3.5 w-3.5" />
              No location
            </span>
          )}
          {stop.active === false && <WholesaleStatusBadge tone="neutral">Paused</WholesaleStatusBadge>}
          {!readOnly && (
            <span className="flex shrink-0 items-center">
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Move ${memberName(stop)} up`} disabled={index === 0} onClick={() => onMove(index, index - 1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Move ${memberName(stop)} down`}
                disabled={index === stops.length - 1}
                onClick={() => onMove(index, index + 1)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Remove ${memberName(stop)}`}
                disabled={!canRemove}
                title={canRemove ? undefined : 'Save or undo the new order first'}
                onClick={() => onRemove(stop)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
};

export default RouteStops;
