import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchRouteDefinitions } from '../customers/wholesale-customer.api';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { formatDay, formatRange } from '../closures/closure.model';
import { formatQty } from '../operations/operations.model';
import { fetchStaleReturns } from './delivery.api';
import { ICreditFilters, IStaleReport, STALE_REASON_LABEL, money } from './delivery.model';
import { CreditFilterBar, FilterOption, lastWeek, optionsFrom } from './credit-filters';

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="ws-card grid gap-0.5 px-4 py-3">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-lg font-semibold" data-testid={`stat-${label}`}>
      {value}
    </span>
  </div>
);

/** Bread brought back at the door, per product and per return, with the credit each earned. */
const StaleReturns = () => {
  const [filters, setFilters] = useState<ICreditFilters>(() => lastWeek());
  const [routes, setRoutes] = useState<IWholesaleRouteDefinition[]>([]);
  const [report, setReport] = useState<IStaleReport | null>(null);
  const [customers, setCustomers] = useState<FilterOption[]>([]);
  const [products, setProducts] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRouteDefinitions()
      .then(setRoutes)
      .catch(() => setRoutes([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    try {
      const result = await fetchStaleReturns(filters);
      if (current !== request.current) return;
      setReport(result);
      if (!filters.customerId) setCustomers(optionsFrom(result.rows, r => r.customerId, r => r.customerName));
      if (!filters.itemId) setProducts(optionsFrom(result.rows, r => r.itemId, r => r.itemName));
    } catch (error) {
      if (current !== request.current) return;
      setReport(null);
      toast.error(wholesaleErrorMessage(error, 'The stale returns could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const routeName = (id?: string | null) => routes.find(r => r.id === id)?.name ?? '';
  const rows = report?.rows ?? [];

  return (
    <WholesalePage title="Stale Returns" context={`Returned at the door, ${formatRange(filters.from, filters.to)}`}>
      <CreditFilterBar filters={filters} onChange={setFilters} routes={routes} customers={customers} products={products} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Returns" value={rows.length} />
        <Stat label="Quantity" value={formatQty(report?.totalQuantity ?? 0)} />
        <Stat label="Credit" value={money(report?.totalCredit ?? 0)} />
      </div>

      {(report?.byProduct ?? []).length > 0 && (
        <div className="ws-card overflow-x-auto">
          <table className="ws-table" data-testid="stale-by-product">
            <thead>
              <tr>
                <th>Product</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {report.byProduct.map(p => (
                <tr key={`${p.itemId}|${p.variantId ?? ''}`}>
                  <td className="font-medium">{p.itemName ?? p.itemId}</td>
                  <td className="text-right">{formatQty(p.quantity)}</td>
                  <td className="text-right">{money(p.credit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="ws-card overflow-x-auto">
        <table className="ws-table" data-testid="stale-rows">
          <thead>
            <tr>
              <th>Delivered</th>
              <th>Route</th>
              <th>Customer</th>
              <th>Product</th>
              <th className="text-right">Quantity</th>
              <th>Reason</th>
              <th className="text-right">Credit per unit</th>
              <th className="text-right">Credit</th>
              <th>Driver</th>
              <th>Credit memo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="whitespace-nowrap">{formatDay(r.deliveryDate)}</td>
                <td>{routeName(r.routeDefinitionId)}</td>
                <td>{r.orderId ? <Link to={`/order/${r.orderId}`} className="text-primary hover:underline">{r.customerName}</Link> : r.customerName}</td>
                <td className="font-medium">{r.itemName ?? r.itemId}</td>
                <td className="text-right">{formatQty(r.quantity)}</td>
                <td>{r.reason ? STALE_REASON_LABEL[r.reason] : '-'}</td>
                <td className="text-right">{money(r.unitCredit)}</td>
                <td className="text-right font-semibold">{money(r.totalCredit)}</td>
                <td>{r.driverUsername ?? ''}</td>
                <td>
                  {r.creditMemoId ? (
                    <Link to={`/logistics/credit-memos?memo=${r.creditMemoId}`} className="text-primary hover:underline">
                      Open
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">No credit</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-muted-foreground">
                  {loading ? 'Loading returns...' : 'No stale returns for these filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WholesalePage>
  );
};

export default StaleReturns;
