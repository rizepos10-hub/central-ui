import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { formatDay } from '../closures/closure.model';
import { fetchFactoryBoard, sendFactoryOrder } from './operations.api';
import { FACTORY_ORDER_STATUS_LABEL, IFactoryBoardRow, WAS_SENT, factoryOrderTone, formatTime, tomorrow } from './operations.model';
import { DayToolbar } from './day-toolbar';
import { NoteDialog } from './note-dialog';

export const SENDER_ROLES = [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_SALES_MANAGER];

/** Every factory for a delivery date: whether its order went out, what the factory answered, and how many routes are approved. */
const FactoryOrders = () => {
  const navigate = useNavigate();
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canSend = hasAnyAuthority(authorities, SENDER_ROLES);

  const [date, setDate] = useState(() => tomorrow());
  const [rows, setRows] = useState<IFactoryBoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<IFactoryBoardRow | null>(null);

  const request = useRef(0);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    try {
      const list = await fetchFactoryBoard(date);
      if (current === request.current) setRows(list);
    } catch (error) {
      if (current !== request.current) return;
      setRows([]);
      toast.error(wholesaleErrorMessage(error, 'The factory orders could not be loaded.'));
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load]);

  const send = async (note: string) => {
    try {
      const detail = await sendFactoryOrder(sending.factoryId, date, note);
      toast.success(`Order sent to ${sending.factoryName}`);
      setSending(null);
      navigate(`/logistics/factory-orders/${detail.order.id}`);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The factory order could not be sent.'));
    }
  };

  const lastEvent = (row: IFactoryBoardRow) => {
    if (row.approvedAt && (row.status === 'APPROVED' || row.status === 'IN_PRODUCTION' || row.status === 'READY' || row.status === 'DISPATCHED')) {
      return `Approved ${formatTime(row.approvedAt)}`;
    }
    if (row.status === 'RETURNED' && row.returnedAt) return `Returned ${formatTime(row.returnedAt)}`;
    if (row.sentAt) return `Sent ${formatTime(row.sentAt)}`;
    return '';
  };

  return (
    <WholesalePage title="Factory Orders" context={`Deliveries on ${formatDay(date)}`}>
      <DayToolbar date={date} onDateChange={setDate} />

      <div className="ws-card overflow-x-auto">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Factory</th>
              <th>Routes approved</th>
              <th>Status</th>
              <th>Version</th>
              <th>Last update</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const sent = row.status != null && WAS_SENT.includes(row.status);
              return (
                <tr
                  key={row.factoryId}
                  data-testid={`factory-${row.factoryId}`}
                  className={row.factoryOrderId ? 'cursor-pointer' : undefined}
                  onClick={() => row.factoryOrderId && navigate(`/logistics/factory-orders/${row.factoryOrderId}`)}
                >
                  <td className="font-medium">{row.factoryName}</td>
                  <td>
                    {row.approvedRoutes} of {row.routesWithOrders}
                    {row.pendingRoutes > 0 && <span className="ml-2 text-xs text-muted-foreground">{row.pendingRoutes} not approved</span>}
                  </td>
                  <td>
                    <WholesaleStatusBadge tone={factoryOrderTone(row.status)}>
                      {row.status ? FACTORY_ORDER_STATUS_LABEL[row.status] : 'Not sent'}
                    </WholesaleStatusBadge>
                  </td>
                  <td>{row.version ? `v${row.version}` : ''}</td>
                  <td className="text-muted-foreground">{lastEvent(row)}</td>
                  <td className="whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                    {canSend && !sent && (
                      <Button size="sm" className="ws-control" disabled={row.approvedRoutes === 0} onClick={() => setSending(row)}>
                        Send
                      </Button>
                    )}
                    {row.factoryOrderId && (
                      <Button size="sm" variant="outline" className="ws-control ml-2" onClick={() => navigate(`/logistics/factory-orders/${row.factoryOrderId}`)}>
                        Open
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No active factories.
                </td>
              </tr>
            )}
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Loading factory orders...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NoteDialog
        open={sending != null}
        title={sending ? `Send the order to ${sending.factoryName}?` : ''}
        description={
          sending &&
          (sending.pendingRoutes > 0
            ? `${sending.approvedRoutes} approved routes go out now. ${sending.pendingRoutes} routes are not approved and are left out of this order.`
            : `All ${sending.approvedRoutes} routes are approved.`)
        }
        confirmLabel="Send"
        onClose={() => setSending(null)}
        onConfirm={send}
      />
    </WholesalePage>
  );
};

export default FactoryOrders;
