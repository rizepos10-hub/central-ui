import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { formatDay } from '../closures/closure.model';
import { fetchProduction } from './operations.api';
import { IProductionMatrix, SHEET_STATUS_LABEL, formatQty, sheetTone, tomorrow } from './operations.model';
import { DayToolbar } from './day-toolbar';

/** What a factory has to produce for a delivery date: produced products by route. Purchased items are on the loading lists. */
const Production = () => {
  const [date, setDate] = useState(() => tomorrow());
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState<string>();
  const [matrix, setMatrix] = useState<IProductionMatrix | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFactories()
      .then(list => {
        const active = list.filter(f => f.active !== false);
        setFactories(active);
        setFactoryId(prev => prev ?? active[0]?.id);
      })
      .catch(() => setFactories([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    if (!factoryId) return;
    const current = ++request.current;
    setLoading(true);
    try {
      const result = await fetchProduction(date, factoryId);
      if (current === request.current) setMatrix(result);
    } catch (error) {
      if (current !== request.current) return;
      setMatrix(null);
      toast.error(wholesaleErrorMessage(error, 'The production list could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [date, factoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const factoryName = factories.find(f => f.id === factoryId)?.name ?? '';
  const pending = matrix?.routes.filter(r => r.sheetStatus !== 'APPROVED').length ?? 0;

  return (
    <WholesalePage
      title="Production"
      context={factoryName ? `${factoryName}, deliveries on ${formatDay(date)}` : 'Choose a factory'}
      actions={
        <Button variant="outline" className="ws-control print:hidden" onClick={() => window.print()} disabled={!matrix}>
          <Printer className="mr-1 h-4 w-4" />
          Print
        </Button>
      }
    >
      <DayToolbar date={date} onDateChange={setDate} factories={factories} factoryId={factoryId} onFactoryChange={setFactoryId} />

      {pending > 0 && (
        <div className="ws-card border-l-4 border-l-[hsl(var(--ws-returned))] px-4 py-2 text-sm" data-testid="pending-routes">
          {pending === 1 ? '1 route is' : `${pending} routes are`} not approved yet, so these quantities can still change.
        </div>
      )}

      <div className="ws-card overflow-x-auto">
        {matrix && matrix.products.length > 0 ? (
          <table className="ws-table" data-testid="production-matrix">
            <thead>
              <tr>
                <th>Route</th>
                {matrix.products.map(p => (
                  <th key={p.key} className="text-right">
                    {p.name}
                  </th>
                ))}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {matrix.routes.map(route => (
                <tr key={route.routeId}>
                  <td>
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: route.color || 'hsl(var(--muted-foreground))' }} />
                      {route.routeName}
                    </span>
                    <WholesaleStatusBadge className="ml-2 print:hidden" tone={sheetTone(route.sheetStatus)}>
                      {SHEET_STATUS_LABEL[route.sheetStatus ?? 'NOT_SUBMITTED']}
                    </WholesaleStatusBadge>
                  </td>
                  {matrix.products.map(p => (
                    <td key={p.key} className="text-right">
                      {route.quantities[p.key] ? formatQty(route.quantities[p.key]) : ''}
                    </td>
                  ))}
                  <td className="text-right font-semibold">{formatQty(route.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td>Total</td>
                {matrix.products.map(p => (
                  <td key={p.key} className="text-right">
                    {formatQty(p.total)}
                  </td>
                ))}
                <td className="text-right">{formatQty(matrix.total)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {loading ? 'Loading production...' : factoryId ? `Nothing to produce for ${formatDay(date)}.` : 'Choose a factory.'}
          </div>
        )}
      </div>
    </WholesalePage>
  );
};

export default Production;
