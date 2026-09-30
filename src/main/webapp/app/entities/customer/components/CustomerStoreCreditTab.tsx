import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WsSelectContent } from 'app/modules/logistics/wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';
import { formatDateForDisplay } from 'app/shared/util/timezone-utils';
import { STORE_CREDIT_ENTRY_LABELS, StoreCreditBalance, StoreCreditEntry } from 'app/shared/model/store-credit.model';

const PAGE_SIZE = 20;

type Direction = 'ADD' | 'DEDUCT';
type Expiry = 'DEFAULT' | 'NEVER' | 'DATE';

const money = (value?: number | null) => (value == null ? '-' : value.toFixed(2));

interface Props {
  customerId: string;
  timeZone?: string;
  branchName: (branchId?: string | null) => string;
}

const dateTime = (value: string, timeZone?: string) => formatDateForDisplay(value, 'yyyy-MM-dd HH:mm', timeZone);
const dateOnly = (value: string, timeZone?: string) => formatDateForDisplay(value, 'yyyy-MM-dd', timeZone);

const CustomerStoreCreditTab = ({ customerId, timeZone, branchName }: Props) => {
  const [balance, setBalance] = useState<StoreCreditBalance | null>(null);
  const [entries, setEntries] = useState<StoreCreditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [direction, setDirection] = useState<Direction>('ADD');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [expiry, setExpiry] = useState<Expiry>('DEFAULT');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const [balanceResponse, entriesResponse] = await Promise.all([
        axios.get<StoreCreditBalance>(`api/customers/${customerId}/store-credit`),
        axios.get<StoreCreditEntry[]>(`api/customers/${customerId}/store-credit/entries`, {
          params: { page: nextPage, size: PAGE_SIZE, sort: 'createdDate,desc' },
        }),
      ]);
      setBalance(balanceResponse.data);
      setEntries(entriesResponse.data ?? []);
      setTotal(Number(entriesResponse.headers['x-total-count'] ?? entriesResponse.data?.length ?? 0));
      setPage(nextPage);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The store credit could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) void load(0);
  }, [customerId]);

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter an amount greater than zero.');
      return;
    }
    if (!note.trim()) {
      toast.error('A note is required.');
      return;
    }
    if (direction === 'ADD' && expiry === 'DATE' && !expiryDate) {
      toast.error('Pick the expiry date.');
      return;
    }
    setSaving(true);
    try {
      if (direction === 'ADD') {
        await axios.post(`api/customers/${customerId}/store-credit/credit`, {
          type: 'ISSUE',
          amount: value,
          note: note.trim(),
          neverExpires: expiry === 'NEVER',
          expiresAt: expiry === 'DATE' ? new Date(`${expiryDate}T23:59:59`).toISOString() : undefined,
        });
      } else {
        await axios.post(`api/customers/${customerId}/store-credit/debit`, {
          type: 'ADJUSTMENT',
          amount: value,
          allowPartial: false,
          note: note.trim(),
        });
      }
      toast.success(direction === 'ADD' ? 'Store credit added.' : 'Store credit deducted.');
      setAmount('');
      setNote('');
      setExpiry('DEFAULT');
      setExpiryDate('');
      await load(0);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The store credit could not be changed.'));
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-md border p-3">
            <div className="text-xs font-medium text-muted-foreground">Balance</div>
            <div className="mt-1 text-lg font-semibold">{money(balance?.balance ?? 0)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs font-medium text-muted-foreground">Next expiry</div>
            <div className="mt-1 text-sm">
              {balance?.nextExpiryAt
                ? `${money(balance.nextExpiryAmount)} on ${dateOnly(balance.nextExpiryAt, timeZone)}`
                : 'Nothing expiring'}
            </div>
          </div>
        </div>

        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Branch</TableHead>
                <TableHead className="text-xs">Details</TableHead>
                <TableHead className="text-right text-xs">Amount</TableHead>
                <TableHead className="text-right text-xs">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">Loading…</TableCell>
                </TableRow>
              )}
              {!loading && entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">No store credit yet.</TableCell>
                </TableRow>
              )}
              {!loading &&
                entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs">{entry.createdDate ? dateTime(entry.createdDate, timeZone) : '-'}</TableCell>
                    <TableCell className="text-xs">
                      {STORE_CREDIT_ENTRY_LABELS[entry.type] ?? entry.type}
                      {entry.online ? ' (online)' : ''}
                    </TableCell>
                    <TableCell className="text-xs">{entry.branchId ? branchName(entry.branchId) : 'Head office'}</TableCell>
                    <TableCell className="text-xs">
                      {[
                        entry.billSequenceNumber ? `Bill #${entry.billSequenceNumber}` : null,
                        entry.expiresAt ? `Expires ${dateOnly(entry.expiresAt, timeZone)}` : null,
                        entry.note,
                        entry.userName || entry.createdBy,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '-'}
                    </TableCell>
                    <TableCell className={`text-right text-xs ${entry.amount < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{money(entry.amount)}</TableCell>
                    <TableCell className="text-right text-xs">{money(entry.balanceAfter)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-xs">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0 || loading} onClick={() => void load(page - 1)}>
              Previous
            </Button>
            <span>
              Page {page + 1} of {pages}
            </span>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page + 1 >= pages || loading} onClick={() => void load(page + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>

      <section className="space-y-3 rounded-md border p-4">
        <h3 className="m-0 text-sm font-semibold">Adjust store credit</h3>
        <div className="grid gap-1.5">
          <Label className="text-xs">Action</Label>
          <Select value={direction} onValueChange={value => setDirection(value as Direction)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <WsSelectContent>
              <SelectItem value="ADD">Add credit</SelectItem>
              <SelectItem value="DEDUCT">Deduct credit</SelectItem>
            </WsSelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Amount</Label>
          <Input className="h-8 text-xs" type="number" min={0} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Note (required)</Label>
          <Input className="h-8 text-xs" value={note} onChange={event => setNote(event.target.value)} />
        </div>
        {direction === 'ADD' && (
          <div className="grid gap-1.5">
            <Label className="text-xs">Expires</Label>
            <Select value={expiry} onValueChange={value => setExpiry(value as Expiry)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <WsSelectContent>
                <SelectItem value="DEFAULT">Setting default</SelectItem>
                <SelectItem value="NEVER">Never</SelectItem>
                <SelectItem value="DATE">On a date</SelectItem>
              </WsSelectContent>
            </Select>
            {expiry === 'DATE' && <Input className="h-8 text-xs" type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} />}
          </div>
        )}
        <Button size="sm" className="h-8 w-full text-xs" disabled={saving} onClick={() => void submit()}>
          {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          {direction === 'ADD' ? 'Add credit' : 'Deduct credit'}
        </Button>
        <p className="m-0 text-[11px] text-muted-foreground">Deductions take the credit that expires first.</p>
      </section>
    </div>
  );
};

export default CustomerStoreCreditTab;
