import React from 'react';

import { ACTION_LABEL, IFactoryOrderEvent, formatQty, formatTime, shortageReasonLabel } from './operations.model';

interface FactoryOrderHistoryProps {
  history: IFactoryOrderEvent[];
  customerNames?: Record<string, string>;
}

/** Every version and action on the factory order, newest first, with who did it and from where. */
export const FactoryOrderHistory = ({ history, customerNames = {} }: FactoryOrderHistoryProps) => (
  <ol className="m-0 grid list-none gap-3 p-0" data-testid="factory-order-history">
    {[...history].reverse().map((event, index) => (
      <li key={`${event.at}-${index}`} className="border-l-2 pl-3">
        <div className="text-sm">
          <span className="font-semibold">{ACTION_LABEL[event.action] ?? event.action}</span>
          {event.version != null && <span className="ml-1.5 text-muted-foreground">v{event.version}</span>}
        </div>
        <div className="text-xs text-muted-foreground">
          {[event.by, formatTime(event.at), event.channel === 'KDS' ? 'from the factory screen' : event.channel === 'WEB' ? 'from the web' : null]
            .filter(Boolean)
            .join(', ')}
        </div>
        {event.note && <div className="mt-1 text-sm">{event.note}</div>}
        {(event.lineChanges ?? []).length > 0 && (
          <ul className="m-0 mt-1 pl-4 text-xs">
            {event.lineChanges.map((change, i) => (
              <li key={i}>
                {change.itemName}: {formatQty(change.fromQty)} to {formatQty(change.toQty)}
                {change.reason && ` (${shortageReasonLabel(change.reason)})`}
              </li>
            ))}
          </ul>
        )}
        {(event.shortageAllocations ?? []).length > 0 && (
          <ul className="m-0 mt-1 pl-4 text-xs text-muted-foreground">
            {event.shortageAllocations.map((a, i) => (
              <li key={i}>
                {a.movedToFactoryId
                  ? `${formatQty(a.fromQty)} moved to another factory`
                  : `${customerNames[a.orderId] ?? 'Customer'}: ${formatQty(a.fromQty)} to ${formatQty(a.toQty)}${a.substituteItemId ? ' (substituted)' : ''}`}
              </li>
            ))}
          </ul>
        )}
      </li>
    ))}
  </ol>
);

export default FactoryOrderHistory;
