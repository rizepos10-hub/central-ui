import React, { useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '@/components/ui/button';

import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { resolveCustomerNote } from './sales.api';
import { ICustomerNote, NOTE_ROLES, NoteSource } from './sales.model';

const SOURCES: Record<NoteSource, string> = { CALL_LIST: 'Call list', ORDER_ENTRY: 'Order entry', DRIVER: 'Driver', OTHER: 'Other' };

export const noteWhen = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '');

const roleLabels = (roles?: string[]) => (roles ?? []).map(r => NOTE_ROLES.find(n => n.value === r)?.label ?? r).join(', ');

interface CustomerNotesTableProps {
  notes: ICustomerNote[];
  loading: boolean;
  showCustomer?: boolean;
  emptyText: string;
  onResolved: (note: ICustomerNote) => void;
}

export const CustomerNotesTable = ({ notes, loading, showCustomer = false, emptyText, onResolved }: CustomerNotesTableProps) => {
  const [resolving, setResolving] = useState<string | null>(null);
  const columns = showCustomer ? 6 : 5;

  const resolve = async (note: ICustomerNote) => {
    setResolving(note.id);
    try {
      const saved = await resolveCustomerNote(note.id);
      toast.success('Note resolved');
      onResolved(saved);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The note could not be resolved.'));
    } finally {
      setResolving(null);
    }
  };

  return (
    <table className="ws-table">
      <thead>
        <tr>
          <th className="w-36">When</th>
          {showCustomer && <th>Customer</th>}
          <th>Note</th>
          <th>From</th>
          <th>Status</th>
          <th className="text-right" />
        </tr>
      </thead>
      <tbody>
        {loading && (
          <tr>
            <td colSpan={columns} className="text-muted-foreground">
              Loading...
            </td>
          </tr>
        )}
        {!loading && notes.length === 0 && (
          <tr>
            <td colSpan={columns} className="text-muted-foreground">
              {emptyText}
            </td>
          </tr>
        )}
        {!loading &&
          notes.map(note => (
            <tr key={note.id}>
              <td className="ws-mono text-[13px]">{noteWhen(note.createdDate)}</td>
              {showCustomer && <td className="font-medium">{note.customerName ?? note.customerId}</td>}
              <td className="max-w-md whitespace-pre-wrap text-[13px]">
                {note.urgent && (
                  <WholesaleStatusBadge tone="cancelled" className="mr-1.5">
                    Urgent
                  </WholesaleStatusBadge>
                )}
                {note.text}
                {note.sendToRoles?.length > 0 && <div className="text-xs text-muted-foreground">Sent to {roleLabels(note.sendToRoles)}</div>}
              </td>
              <td className="text-[13px]">
                {note.createdBy ?? '-'}
                {note.source && <div className="text-xs text-muted-foreground">{SOURCES[note.source] ?? note.source}</div>}
              </td>
              <td className="text-[13px]">
                {note.status === 'RESOLVED' ? (
                  <>
                    <WholesaleStatusBadge tone="approved">Resolved</WholesaleStatusBadge>
                    <div className="text-xs text-muted-foreground">
                      {note.resolvedBy ?? ''} {noteWhen(note.resolvedAt)}
                    </div>
                  </>
                ) : (
                  <WholesaleStatusBadge tone="amendment">Open</WholesaleStatusBadge>
                )}
              </td>
              <td className="text-right">
                {note.status !== 'RESOLVED' && (
                  <Button variant="outline" size="sm" className="ws-control" onClick={() => resolve(note)} disabled={resolving === note.id}>
                    Resolve
                  </Button>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};

export default CustomerNotesTable;
