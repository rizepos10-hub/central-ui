import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsAlertDialogContent, WsDropdownMenuContent } from '../wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { FactoryEditor } from './factory-editor';
import { deleteFactory, fetchFactories } from './wholesale-factory.api';
import { IWholesaleFactory, newFactory, sendModeLabel } from './wholesale-factory.model';

type Filter = 'active' | 'all';

const byOrder = (a: IWholesaleFactory, b: IWholesaleFactory) =>
  (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) || (a.name ?? '').localeCompare(b.name ?? '');

const WholesaleFactories = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canManage = hasAnyAuthority(authorities, [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN]);

  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<IWholesaleFactory | null>(null);
  const [deleting, setDeleting] = useState<IWholesaleFactory | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFactories(await fetchFactories());
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The factories could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => factories.filter(f => filter === 'all' || f.active).sort(byOrder), [factories, filter]);
  const activeCount = factories.filter(f => f.active).length;

  const onSaved = (saved: IWholesaleFactory) => {
    setFactories(prev => (prev.some(f => f.id === saved.id) ? prev.map(f => (f.id === saved.id ? saved : f)) : [...prev, saved]));
    setEditing(null);
  };

  const confirmDelete = async () => {
    const target = deleting;
    setDeleting(null);
    try {
      await deleteFactory(target.id);
      setFactories(prev => prev.filter(f => f.id !== target.id));
      toast.success(`${target.name} deleted`);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The factory could not be deleted.'));
    }
  };

  return (
    <WholesalePage
      title="Factories"
      context={`${activeCount} active of ${factories.length} / cut-off and how each factory's order is sent`}
      actions={
        canManage && (
          <Button className="ws-control" onClick={() => setEditing(newFactory())}>
            <Plus className="mr-1 h-4 w-4" />
            New factory
          </Button>
        )
      }
    >
      <div className="flex items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full border bg-card" role="group" aria-label="Show">
          {(['all', 'active'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px]', filter === f && 'bg-accent font-semibold text-accent-foreground')}
            >
              {f === 'all' ? 'All' : 'Active'}
            </button>
          ))}
        </div>
        {!canManage && <span className="text-xs text-muted-foreground">Read only: factories are managed by wholesale admins.</span>}
      </div>

      <div className="ws-card overflow-hidden">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Factory</th>
              <th>Address</th>
              <th>Cut-off</th>
              <th>Sends order</th>
              <th>Kiosk</th>
              <th>Pin</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map(f => (
              <tr key={f.id} className="cursor-pointer" onClick={() => setEditing(f)}>
                <td>
                  <span className="font-medium">{f.name}</span>
                  {f.code && <span className="ws-mono ml-2 text-xs text-muted-foreground">{f.code}</span>}
                </td>
                <td className="max-w-[280px] truncate text-muted-foreground">{f.address?.fullAddress || '-'}</td>
                <td className="ws-mono">
                  {f.orderCutoffTime || '-'}
                  {f.timeZone && <span className="ml-1.5 font-sans text-xs text-muted-foreground">{f.timeZone}</span>}
                </td>
                <td>{sendModeLabel(f.sendMode)}</td>
                <td>{f.fulfillmentScreenEnabled ? 'Yes' : 'No'}</td>
                <td>
                  {f.latitude != null && f.longitude != null ? (
                    <MapPin className="h-4 w-4 text-primary" aria-label="Pinned" />
                  ) : (
                    <span className="text-xs text-[hsl(var(--ws-returned))]">No pin</span>
                  )}
                </td>
                <td>
                  <WholesaleStatusBadge tone={f.active ? 'approved' : 'neutral'}>{f.active ? 'Active' : 'Inactive'}</WholesaleStatusBadge>
                </td>
                <td className="w-8" onClick={e => e.stopPropagation()}>
                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${f.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <WsDropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(f)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(f)}>
                          Delete
                        </DropdownMenuItem>
                      </WsDropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
            {!loading && shown.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  {factories.length === 0 ? 'No factories yet.' : 'No active factories.'}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading factories...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <FactoryEditor factory={editing} readOnly={!canManage} onClose={() => setEditing(null)} onSaved={onSaved} />

      <AlertDialog open={deleting != null} onOpenChange={open => !open && setDeleting(null)}>
        <WsAlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              A factory that routes or manually assigned customers still use can't be deleted; deactivate it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="ws-control">Cancel</AlertDialogCancel>
            <AlertDialogAction className="ws-control bg-destructive text-white hover:bg-destructive/90" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </WsAlertDialogContent>
      </AlertDialog>
    </WholesalePage>
  );
};

export default WholesaleFactories;
