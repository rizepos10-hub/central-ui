import React from 'react';

import { cn } from '@/src/main/webapp/app/lib/utils';

import { IFactoryOrder, PRODUCTION_STATUS_LABEL, formatQty, isShort, lineKey, shortageReasonLabel } from './operations.model';

interface FactoryOrderLinesProps {
  order: IFactoryOrder;
  routeNames: Record<string, string>;
  factoryNames?: Record<string, string>;
  /** Extra cell at the end of each row, for the factory's inputs. */
  renderAction?: (line: IFactoryOrder['lines'][number]) => React.ReactNode;
  actionHeader?: string;
}

/** The factory order's products with requested, available and approved quantities and the split per route. */
export const FactoryOrderLines = ({ order, routeNames, factoryNames = {}, renderAction, actionHeader }: FactoryOrderLinesProps) => (
  <div className="ws-card overflow-x-auto">
    <table className="ws-table" data-testid="factory-order-lines">
      <thead>
        <tr>
          <th>Product</th>
          <th className="text-right">Requested</th>
          <th className="text-right">Available</th>
          <th className="text-right">Approved</th>
          <th>Production</th>
          <th>Routes</th>
          {renderAction && <th>{actionHeader}</th>}
        </tr>
      </thead>
      <tbody>
        {order.lines.map(line => (
          <tr key={`${lineKey(line)}-${line.transferredFromFactoryId ?? ''}`} className={cn(isShort(line) && 'bg-[hsl(var(--ws-returned)/0.06)]')}>
            <td>
              <div className="font-medium">{line.itemName}</div>
              {line.sourcing === 'PURCHASED' && <div className="text-xs text-muted-foreground">Purchased</div>}
              {line.transferredFromFactoryId && (
                <div className="text-xs text-muted-foreground">Moved from {factoryNames[line.transferredFromFactoryId] ?? 'another factory'}</div>
              )}
            </td>
            <td className="text-right">{formatQty(line.requestedQty)}</td>
            <td className="text-right">
              {formatQty(line.availableQty)}
              {isShort(line) && <div className="text-xs text-[hsl(var(--ws-returned))]">{shortageReasonLabel(line.shortageReason)}</div>}
            </td>
            <td className="text-right">{formatQty(line.approvedQty)}</td>
            <td className="text-muted-foreground">{line.productionStatus ? PRODUCTION_STATUS_LABEL[line.productionStatus] : ''}</td>
            <td className="text-xs text-muted-foreground">
              {(line.routeBreakdown ?? []).map(part => `${routeNames[part.routeDefinitionId] ?? 'Route'} ${formatQty(part.qty)}`).join(', ')}
            </td>
            {renderAction && <td>{renderAction(line)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default FactoryOrderLines;
