import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { formatDay } from '../closures/closure.model';
import { fetchConsolidatedSheet } from './operations.api';
import { IConsolidatedSheet, SHEET_STATUS_LABEL, formatQty, sheetTone } from './operations.model';

interface ConsolidatedSheetProps {
  date: string;
  factoryId?: string | null;
  factoryName: (id?: string | null) => string;
}

/** Products down the side, the day's routes across, with totals per product and per route. */
export const ConsolidatedSheet = ({ date, factoryId, factoryName }: ConsolidatedSheetProps) => {
  const [sheet, setSheet] = useState<IConsolidatedSheet | null>(null);
  const [loading, setLoading] = useState(true);

  const request = useRef(0);
  useEffect(() => {
    const current = ++request.current;
    setLoading(true);
    fetchConsolidatedSheet(date, factoryId)
      .then(result => current === request.current && setSheet(result))
      .catch(error => {
        if (current !== request.current) return;
        setSheet(null);
        toast.error(wholesaleErrorMessage(error, 'The consolidated sheet could not be loaded.'));
      })
      .finally(() => current === request.current && setLoading(false));
  }, [date, factoryId]);

  const routes = useMemo(() => (sheet?.routes ?? []).filter(r => r.orderCount > 0), [sheet]);
  const routeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    (sheet?.products ?? []).forEach(p => Object.entries(p.byRoute).forEach(([routeId, qty]) => (totals[routeId] = (totals[routeId] ?? 0) + qty)));
    return totals;
  }, [sheet]);

  if (loading && !sheet) {
    return <div className="ws-card py-8 text-center text-sm text-muted-foreground">Loading the consolidated sheet...</div>;
  }
  if (!sheet || sheet.products.length === 0) {
    return <div className="ws-card py-8 text-center text-sm text-muted-foreground">No orders deliver on {formatDay(date)}.</div>;
  }

  return (
    <div className="ws-card overflow-x-auto">
      <table className="ws-table" aria-label="Consolidated order sheet">
        <thead>
          <tr>
            <th>Product</th>
            {routes.map(route => (
              <th key={route.routeId} className="ws-num whitespace-nowrap" data-testid={`route-${route.routeId}`}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: route.color || 'hsl(var(--muted-foreground))' }} />
                  {route.routeName}
                </span>
                <div className="text-[11px] font-normal normal-case text-muted-foreground">
                  {factoryName(route.factoryId)}
                  {factoryName(route.factoryId) ? ' / ' : ''}
                  <WholesaleStatusBadge tone={sheetTone(route.status)}>{SHEET_STATUS_LABEL[route.status] ?? route.status}</WholesaleStatusBadge>
                </div>
              </th>
            ))}
            <th className="ws-num">Total</th>
          </tr>
        </thead>
        <tbody>
          {sheet.products.map(product => (
            <tr key={product.key}>
              <td>
                <span className="font-medium">{product.name}</span>
                {product.sourcing === 'PURCHASED' && <span className="ml-1.5 text-xs text-muted-foreground">purchased</span>}
              </td>
              {routes.map(route => (
                <td key={route.routeId} className="ws-num ws-mono">
                  {product.byRoute[route.routeId] ? formatQty(product.byRoute[route.routeId]) : ''}
                </td>
              ))}
              <td className="ws-num ws-mono font-semibold">{formatQty(product.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-semibold">
            <td>
              Total
              <div className="text-[11px] font-normal text-muted-foreground">orders</div>
            </td>
            {routes.map(route => (
              <td key={route.routeId} className="ws-num ws-mono">
                {formatQty(routeTotals[route.routeId] ?? 0)}
                <div className="text-[11px] font-normal text-muted-foreground">{route.orderCount}</div>
              </td>
            ))}
            <td className="ws-num ws-mono" data-testid="grand-total">
              {formatQty(sheet.total)}
              <div className="text-[11px] font-normal text-muted-foreground">{routes.reduce((sum, r) => sum + r.orderCount, 0)}</div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ConsolidatedSheet;
