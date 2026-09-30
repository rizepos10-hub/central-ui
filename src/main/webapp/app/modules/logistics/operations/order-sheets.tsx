import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { formatDay } from '../closures/closure.model';
import { approveOrderSheet, fetchOrderSheets, reopenOrderSheet, submitOrderSheet } from './operations.api';
import { IOrderSheetRow, SHEET_STATUS_LABEL, formatQty, formatTime, sheetTone, tomorrow } from './operations.model';
import { ALL_FACTORIES, DayToolbar } from './day-toolbar';
import { NoteDialog } from './note-dialog';
import { ConsolidatedSheet } from './consolidated-sheet';

type Action = { kind: 'submit' | 'approve' | 'reopen'; row: IOrderSheetRow };
type SheetView = 'route' | 'consolidated';

const VIEWS: { value: SheetView; label: string }[] = [
  { value: 'route', label: 'By route' },
  { value: 'consolidated', label: 'Consolidated' },
];

const ACTION_TEXT = {
  submit: {
    title: 'Submit this route?',
    confirm: 'Submit for approval',
    description: 'Its orders are locked for editing until a manager approves or reopens the route.',
  },
  approve: { title: 'Approve this route?', confirm: 'Approve', description: 'The route counts toward the factory order.' },
  reopen: { title: 'Reopen this route?', confirm: 'Reopen', description: 'Its orders can be edited again and it has to be submitted again.' },
};

/** Route order sheets for a delivery date: salesmen submit their routes, managers approve or reopen them. */
const OrderSheets = () => {
  const [date, setDate] = useState(() => tomorrow());
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [factoryId, setFactoryId] = useState(ALL_FACTORIES);
  const [rows, setRows] = useState<IOrderSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action | null>(null);
  const [view, setView] = useState<SheetView>('route');

  useEffect(() => {
    fetchFactories()
      .then(list => setFactories(list.filter(f => f.active !== false)))
      .catch(() => setFactories([]));
  }, []);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    try {
      const list = await fetchOrderSheets(date, factoryId === ALL_FACTORIES ? null : factoryId);
      if (current === request.current) setRows(list);
    } catch (error) {
      if (current !== request.current) return;
      setRows([]);
      toast.error(wholesaleErrorMessage(error, 'The order sheets could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [date, factoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const factoryName = (id?: string | null) => factories.find(f => f.id === id)?.name ?? '';

  const counts = useMemo(
    () => ({
      approved: rows.filter(r => r.status === 'APPROVED').length,
      pending: rows.filter(r => r.status === 'PENDING_APPROVAL').length,
      open: rows.filter(r => r.status === 'NOT_SUBMITTED' || r.status === 'REOPENED').length,
    }),
    [rows],
  );

  const run = async (note: string) => {
    const { kind, row } = action;
    try {
      const updated =
        kind === 'submit'
          ? await submitOrderSheet(row.routeId, row.deliveryDate, note)
          : kind === 'approve'
            ? await approveOrderSheet(row.routeId, row.deliveryDate, note)
            : await reopenOrderSheet(row.routeId, row.deliveryDate, note);
      setRows(prev => prev.map(r => (r.routeId === updated.routeId ? updated : r)));
      toast.success(kind === 'submit' ? 'Route submitted for approval' : kind === 'approve' ? 'Route approved' : 'Route reopened');
      setAction(null);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The route could not be updated.'));
    }
  };

  const who = (by?: string | null, at?: string | null) => (by ? `${by}${at ? `, ${formatTime(at)}` : ''}` : '');

  return (
    <WholesalePage
      title="Order Sheets"
      context={`Routes delivering on ${formatDay(date)}: ${counts.approved} approved, ${counts.pending} waiting for approval, ${counts.open} not submitted`}
      actions={
        <Button variant="outline" className="ws-control print:hidden" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" />
          Print
        </Button>
      }
    >
      <DayToolbar date={date} onDateChange={setDate} factories={factories} factoryId={factoryId} onFactoryChange={setFactoryId} allowAllFactories>
        <div className="inline-flex overflow-hidden rounded-full border bg-card" role="group" aria-label="View">
          {VIEWS.map(v => (
            <button
              key={v.value}
              type="button"
              aria-pressed={view === v.value}
              onClick={() => setView(v.value)}
              className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px]', view === v.value && 'bg-accent font-semibold text-accent-foreground')}
            >
              {v.label}
            </button>
          ))}
        </div>
      </DayToolbar>

      {view === 'consolidated' && <ConsolidatedSheet date={date} factoryId={factoryId === ALL_FACTORIES ? null : factoryId} factoryName={factoryName} />}

      <div className={cn('ws-card overflow-x-auto', view === 'consolidated' && 'hidden')}>
        <table className="ws-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Factory</th>
              <th className="text-right">Customers</th>
              <th className="text-right">Orders</th>
              <th className="text-right">Quantity</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Approved</th>
              <th className="print:hidden" />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.routeId} data-testid={`sheet-${row.routeId}`}>
                <td>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.color || 'hsl(var(--muted-foreground))' }} />
                    {row.routeName}
                    {row.routeCode && <span className="text-muted-foreground">{row.routeCode}</span>}
                  </span>
                  {row.status === 'REOPENED' && row.reopenReason && (
                    <div className="mt-0.5 text-xs text-muted-foreground">Reopened: {row.reopenReason}</div>
                  )}
                </td>
                <td className="text-muted-foreground">{factoryName(row.factoryId)}</td>
                <td className="text-right">{row.customerCount}</td>
                <td className="text-right">{row.orderCount}</td>
                <td className="text-right">{formatQty(row.quantity)}</td>
                <td>
                  <WholesaleStatusBadge tone={sheetTone(row.status)}>{SHEET_STATUS_LABEL[row.status] ?? row.status}</WholesaleStatusBadge>
                </td>
                <td className="text-muted-foreground" title={row.submitNote ?? undefined}>
                  {who(row.submittedBy, row.submittedAt)}
                </td>
                <td className="text-muted-foreground" title={row.approvalNote ?? undefined}>
                  {who(row.approvedBy, row.approvedAt)}
                </td>
                <td className="whitespace-nowrap text-right print:hidden">
                  {row.canSubmit && (
                    <Button size="sm" className="ws-control" onClick={() => setAction({ kind: 'submit', row })} disabled={row.orderCount === 0}>
                      Submit
                    </Button>
                  )}
                  {row.canApprove && (
                    <Button size="sm" className="ws-control ml-2" onClick={() => setAction({ kind: 'approve', row })}>
                      Approve
                    </Button>
                  )}
                  {row.canReopen && (
                    <Button size="sm" variant="outline" className="ws-control ml-2" onClick={() => setAction({ kind: 'reopen', row })}>
                      Reopen
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  No routes deliver on {formatDay(date)}.
                </td>
              </tr>
            )}
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  Loading order sheets...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NoteDialog
        open={action != null}
        title={action ? ACTION_TEXT[action.kind].title : ''}
        description={action && `${action.row.routeName}, ${formatDay(action.row.deliveryDate)}. ${ACTION_TEXT[action.kind].description}`}
        label={action?.kind === 'reopen' ? 'Why is it reopened?' : 'Note'}
        requiredMessage={action?.kind === 'reopen' ? 'Say why the route is reopened' : undefined}
        confirmLabel={action ? ACTION_TEXT[action.kind].confirm : ''}
        onClose={() => setAction(null)}
        onConfirm={run}
      />
    </WholesalePage>
  );
};

export default OrderSheets;
