import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
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
import { fetchFactories } from '../factories/wholesale-factory.api';
import { IWholesaleFactory } from '../factories/wholesale-factory.model';
import { UserEditor } from './user-editor';
import { deleteUser, fetchUsers } from './wholesale-user.api';
import { IWholesaleUser, USER_KINDS, WholesaleUserKind, kindSingular, newUser, userName } from './wholesale-user.model';

const PAGE_SIZE = 50;

const WholesaleUsers = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const [kind, setKind] = useState<WholesaleUserKind>('salesManagers');
  const canManage = hasAnyAuthority(
    authorities,
    kind === 'factoryUsers'
      ? [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_SALES_MANAGER]
      : [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN],
  );
  const [page, setPage] = useState(0);
  const [users, setUsers] = useState<IWholesaleUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [factories, setFactories] = useState<IWholesaleFactory[]>([]);

  const [editing, setEditing] = useState<IWholesaleUser | null>(null);
  const [deleting, setDeleting] = useState<IWholesaleUser | null>(null);

  useEffect(() => {
    fetchFactories()
      .then(setFactories)
      .catch(() => setFactories([]));
  }, []);

  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latestRequest.current;
    setLoading(true);
    try {
      const result = await fetchUsers(kind, page, PAGE_SIZE);
      if (request !== latestRequest.current) return;
      setUsers(result.items);
      setTotal(result.total);
    } catch (error) {
      if (request === latestRequest.current) toast.error(wholesaleErrorMessage(error, 'The users could not be loaded.'));
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, [kind, page]);

  useEffect(() => {
    load();
  }, [load]);

  const switchKind = (next: WholesaleUserKind) => {
    if (next === kind) return;
    setUsers([]);
    setPage(0);
    setKind(next);
  };

  const factoryNames = (ids?: string[]) =>
    (ids ?? []).map(id => factories.find(f => f.id === id)?.name ?? id).join(', ') || '-';

  const onSaved = () => {
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    const target = deleting;
    setDeleting(null);
    try {
      await deleteUser(kind, target.id);
      toast.success(`${userName(target)} deleted`);
      load();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, `The ${kindSingular(kind)} could not be deleted.`));
    }
  };

  const isFactory = kind === 'factoryUsers';
  const columns = isFactory ? 6 : 5;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <WholesalePage
      title="Wholesale Users"
      context="Sales managers, factory users with the factories they work for, and drivers"
      actions={
        canManage && (
          <Button className="ws-control" onClick={() => setEditing(newUser())}>
            <Plus className="mr-1 h-4 w-4" />
            New {kindSingular(kind)}
          </Button>
        )
      }
    >
      <div className="flex items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-full border bg-card" role="tablist" aria-label="User type">
          {USER_KINDS.map(k => (
            <button
              key={k.value}
              type="button"
              role="tab"
              aria-selected={kind === k.value}
              onClick={() => switchKind(k.value)}
              className={cn('h-[calc(var(--ws-control-h)-2px)] px-3 text-[13px]', kind === k.value && 'bg-accent font-semibold text-accent-foreground')}
            >
              {k.label}
            </button>
          ))}
        </div>
        {!canManage && <span className="text-xs text-muted-foreground">Read only.</span>}
      </div>

      <div className="ws-card overflow-hidden">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              {isFactory && <th>Factories</th>}
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!loading &&
              users.map(u => (
                <tr key={u.id} className="cursor-pointer" onClick={() => setEditing(u)}>
                  <td className="font-medium">{userName(u)}</td>
                  <td>{u.email || '-'}</td>
                  <td className="ws-mono">{u.username}</td>
                  {isFactory && (
                    <td>
                      {u.factoryIds?.length ? factoryNames(u.factoryIds) : <span className="text-xs text-[hsl(var(--ws-returned))]">No factory</span>}
                    </td>
                  )}
                  <td>
                    <WholesaleStatusBadge tone={u.enabled === false ? 'neutral' : 'approved'}>{u.enabled === false ? 'Disabled' : 'Active'}</WholesaleStatusBadge>
                  </td>
                  <td className="w-8" onClick={e => e.stopPropagation()}>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${userName(u)}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <WsDropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditing(u)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(u)}>
                            Delete
                          </DropdownMenuItem>
                        </WsDropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={columns} className="py-8 text-center text-muted-foreground">
                  No {USER_KINDS.find(k => k.value === kind)?.label.toLowerCase()} yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={columns} className="py-8 text-center text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-[13px]">
          <span className="text-muted-foreground">
            Page {page + 1} of {pages}
          </span>
          <Button variant="outline" className="ws-control" disabled={page === 0 || loading} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" className="ws-control" disabled={page + 1 >= pages || loading} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <UserEditor kind={kind} user={editing} factories={factories} readOnly={!canManage} onClose={() => setEditing(null)} onSaved={onSaved} />

      <AlertDialog open={deleting != null} onOpenChange={open => !open && setDeleting(null)}>
        <WsAlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {userName(deleting)}?</AlertDialogTitle>
            <AlertDialogDescription>They can no longer sign in. This can&apos;t be undone.</AlertDialogDescription>
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

export default WholesaleUsers;
