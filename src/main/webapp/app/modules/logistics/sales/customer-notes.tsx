import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { CustomerNotesTable } from './customer-notes-table';
import { fetchCustomerNotes } from './sales.api';
import { ICustomerNote, NoteStatus } from './sales.model';

const ALL = '__all';

const CustomerNotes = () => {
  const [status, setStatus] = useState<NoteStatus | typeof ALL>('OPEN');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [notes, setNotes] = useState<ICustomerNote[]>([]);
  const [loading, setLoading] = useState(true);

  const latest = useRef(0);
  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    try {
      const found = await fetchCustomerNotes({ status: status === ALL ? undefined : status, urgent: urgentOnly || undefined });
      if (request === latest.current) setNotes(found);
    } catch (error) {
      if (request === latest.current) toast.error(wholesaleErrorMessage(error, 'The notes could not be loaded.'));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [status, urgentOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const onResolved = (saved: ICustomerNote) =>
    setNotes(prev => (status === 'OPEN' ? prev.filter(n => n.id !== saved.id) : prev.map(n => (n.id === saved.id ? saved : n))));

  return (
    <WholesalePage
      title="Customer Notes"
      context={`${notes.length} note${notes.length === 1 ? '' : 's'}`}
      actions={
        <>
          <Select value={status} onValueChange={value => setStatus(value as NoteStatus | typeof ALL)}>
            <SelectTrigger className="ws-control w-36" aria-label="Status">
              <SelectValue />
            </SelectTrigger>
            <WsSelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value={ALL}>All</SelectItem>
            </WsSelectContent>
          </Select>
          <label className="flex items-center gap-2 text-[13px]">
            <Checkbox checked={urgentOnly} onCheckedChange={checked => setUrgentOnly(checked === true)} />
            Urgent only
          </label>
        </>
      }
    >
      <div className="ws-card overflow-x-auto">
        <CustomerNotesTable notes={notes} loading={loading} showCustomer emptyText="No notes to show." onResolved={onResolved} />
      </div>
    </WholesalePage>
  );
};

export default CustomerNotes;
