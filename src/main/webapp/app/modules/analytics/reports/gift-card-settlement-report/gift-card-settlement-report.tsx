import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, Lock, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { WsDialogContent } from 'app/modules/logistics/wholesale-ui/wholesale-overlays';
import { WholesaleStatusBadge } from 'app/modules/logistics/wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';

interface Line {
  id: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  giftCardAmount: number;
  storeCreditAmount: number;
  amount: number;
  paid: boolean;
  paidAt?: string | null;
  paidBy?: string | null;
  reference?: string | null;
}

interface BranchSummary {
  branchId: string;
  branchName: string;
  giftCardsLoaded: number;
  giftCardsSpent: number;
  storeCreditIssued: number;
  storeCreditRedeemed: number;
  owedToOthers: number;
  owedByOthers: number;
  net: number;
}

interface BroughtForward {
  closingId: string;
  periodStart: string;
  periodEnd: string;
  line: Line;
}

interface Report {
  fromDate: string;
  toDate: string;
  lastClosingId?: string | null;
  settlements: Line[];
  branches: BranchSummary[];
  broughtForward: BroughtForward[];
}

interface Closing {
  id: string;
  periodStart: string;
  periodEnd: string;
  note?: string | null;
  createdBy?: string | null;
  lines: Line[];
}

const amount = (value?: number | null) => (value == null ? '-' : Number(value).toFixed(2));
const day = (value?: string | null) => (value ? new Date(value).toLocaleDateString('en-CA') : '-');
const periodStartLabel = (value?: string | null) => (!value || new Date(value).getTime() <= 0 ? 'the beginning' : day(value));
const endOfDay = (value: string) => {
  const end = new Date(`${value}T23:59:59.999`);
  return (end.getTime() > Date.now() ? new Date() : end).toISOString();
};

const BranchSettlementReport = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities || []);
  const canClose = hasAnyAuthority(authorities, ['CLOSE_BRANCH_SETTLEMENTS']);
  const today = new Date().toLocaleDateString('en-CA');

  const [to, setTo] = useState(today);
  const [report, setReport] = useState<Report | null>(null);
  const [closings, setClosings] = useState<Closing[]>([]);
  const [loading, setLoading] = useState(false);

  const [closeOpen, setCloseOpen] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const [closing, setClosing] = useState(false);

  const [payTarget, setPayTarget] = useState<{ closingId: string; line: Line } | null>(null);
  const [reference, setReference] = useState('');
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [reportResponse, closingsResponse] = await Promise.all([
        axios.get<Report>('api/branch-settlements/report', { params: { toDate: endOfDay(to) } }),
        axios.get<Closing[]>('api/branch-settlements/closings', { params: { page: 0, size: 12 } }),
      ]);
      setReport(reportResponse.data);
      setClosings(closingsResponse.data ?? []);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The report could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const closePeriod = async () => {
    setClosing(true);
    try {
      await axios.post('api/branch-settlements/closings', { toDate: endOfDay(to), note: closeNote.trim() || null });
      toast.success('Period closed.');
      setCloseOpen(false);
      setCloseNote('');
      await load();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The period could not be closed.'));
    } finally {
      setClosing(false);
    }
  };

  const setPaid = async (closingId: string, line: Line, paid: boolean, ref?: string) => {
    setPaying(true);
    try {
      await axios.put(`api/branch-settlements/closings/${closingId}/lines/${line.id}/payment`, { paid, reference: ref ?? line.reference ?? null });
      toast.success(paid ? 'Marked as paid.' : 'Marked as unpaid.');
      setPayTarget(null);
      setReference('');
      await load();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The payment could not be saved.'));
    } finally {
      setPaying(false);
    }
  };

  const settlements = report?.settlements ?? [];
  const branches = report?.branches ?? [];
  const broughtForward = report?.broughtForward ?? [];

  return (
    <WholesalePage
      title="Branch Settlement"
      context="What branches owe each other for gift cards and store credit taken in at one branch and spent at another. The open period starts where the last closing ended; unpaid lines of closed periods are brought forward."
    >
      <section className="ws-card grid gap-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label>From</Label>
            <Input className="ws-control" value={report ? periodStartLabel(report.fromDate) : '-'} disabled readOnly />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="branch-settlement-to">To</Label>
            <Input id="branch-settlement-to" className="ws-control" type="date" max={today} value={to} onChange={event => setTo(event.target.value)} />
          </div>
          <Button className="ws-control" disabled={loading} onClick={() => void load()}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
            Search
          </Button>
          {canClose && (
            <Button variant="outline" className="ws-control" disabled={loading || !report} onClick={() => setCloseOpen(true)}>
              <Lock className="mr-1 h-4 w-4" />
              Close period
            </Button>
          )}
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          Gift cards count only for branches with Share gift cards turned on. Store credit counts where it was issued at one branch and redeemed at another; credit issued from head office is not settled.
        </p>
      </section>

      <div className="ws-card overflow-auto">
        <table className="ws-table" aria-label="Who owes whom">
          <thead>
            <tr>
              <th>Branch that owes</th>
              <th>Owes to</th>
              <th className="ws-num">Gift cards</th>
              <th className="ws-num">Store credit</th>
              <th className="ws-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {!report && (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground">{loading ? 'Loading…' : 'Choose the date and search.'}</td>
              </tr>
            )}
            {report && settlements.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground">Nothing is owed between branches in the open period.</td>
              </tr>
            )}
            {settlements.map(row => (
              <tr key={`${row.fromBranchId}-${row.toBranchId}`}>
                <td className="font-medium">{row.fromBranchName}</td>
                <td>{row.toBranchName}</td>
                <td className="ws-num">{amount(row.giftCardAmount)}</td>
                <td className="ws-num">{amount(row.storeCreditAmount)}</td>
                <td className="ws-num font-semibold">{amount(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {broughtForward.length > 0 && (
        <div className="ws-card overflow-auto">
          <table className="ws-table" aria-label="Unpaid from closed periods">
            <thead>
              <tr>
                <th>Period</th>
                <th>Branch that owes</th>
                <th>Owes to</th>
                <th className="ws-num">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {broughtForward.map(item => (
                <tr key={`${item.closingId}-${item.line.id}`}>
                  <td>{periodStartLabel(item.periodStart)} to {day(item.periodEnd)}</td>
                  <td className="font-medium">{item.line.fromBranchName}</td>
                  <td>{item.line.toBranchName}</td>
                  <td className="ws-num">{amount(item.line.amount)}</td>
                  <td className="text-right">
                    {canClose && (
                      <Button variant="outline" className="ws-control" onClick={() => setPayTarget({ closingId: item.closingId, line: item.line })}>
                        Mark paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="m-0 p-3 text-xs text-muted-foreground">Brought forward: lines of closed periods that are not paid yet.</p>
        </div>
      )}

      {report && branches.length > 0 && (
        <div className="ws-card overflow-auto">
          <table className="ws-table" aria-label="By branch">
            <thead>
              <tr>
                <th>Branch</th>
                <th className="ws-num">Cards loaded</th>
                <th className="ws-num">Cards spent</th>
                <th className="ws-num">Credit issued</th>
                <th className="ws-num">Credit redeemed</th>
                <th className="ws-num">Owes others</th>
                <th className="ws-num">Owed by others</th>
                <th className="ws-num">Net</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch.branchId}>
                  <td className="font-medium">{branch.branchName}</td>
                  <td className="ws-num">{amount(branch.giftCardsLoaded)}</td>
                  <td className="ws-num">{amount(branch.giftCardsSpent)}</td>
                  <td className="ws-num">{amount(branch.storeCreditIssued)}</td>
                  <td className="ws-num">{amount(branch.storeCreditRedeemed)}</td>
                  <td className="ws-num">{amount(branch.owedToOthers)}</td>
                  <td className="ws-num">{amount(branch.owedByOthers)}</td>
                  <td className="ws-num">{amount(branch.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="m-0 p-3 text-xs text-muted-foreground">Net above zero means other branches owe this branch.</p>
        </div>
      )}

      <div className="ws-card overflow-auto">
        <table className="ws-table" aria-label="Closed periods">
          <thead>
            <tr>
              <th>Closed period</th>
              <th>Closed by</th>
              <th>Note</th>
              <th>Branch that owes</th>
              <th>Owes to</th>
              <th className="ws-num">Amount</th>
              <th>Payment</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {closings.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted-foreground">No closed periods yet.</td>
              </tr>
            )}
            {closings.flatMap(closingEntry => {
              const lines = closingEntry.lines?.length ? closingEntry.lines : [null];
              return lines.map((line, index) => (
                <tr key={`${closingEntry.id}-${line?.id ?? 'none'}`}>
                  <td>{index === 0 ? `${periodStartLabel(closingEntry.periodStart)} to ${day(closingEntry.periodEnd)}` : ''}</td>
                  <td>{index === 0 ? closingEntry.createdBy ?? '-' : ''}</td>
                  <td>{index === 0 ? closingEntry.note ?? '' : ''}</td>
                  <td className="font-medium">{line?.fromBranchName ?? 'Nothing owed'}</td>
                  <td>{line?.toBranchName ?? ''}</td>
                  <td className="ws-num">{line ? amount(line.amount) : ''}</td>
                  <td>
                    {line && (
                      <WholesaleStatusBadge tone={line.paid ? 'approved' : 'new'}>
                        {line.paid ? `Paid${line.reference ? ` · ${line.reference}` : ''}` : 'Unpaid'}
                      </WholesaleStatusBadge>
                    )}
                  </td>
                  <td className="text-right">
                    {line && canClose && (line.paid ? (
                      <Button variant="outline" className="ws-control" disabled={paying} onClick={() => void setPaid(closingEntry.id, line, false)}>
                        Undo
                      </Button>
                    ) : (
                      <Button variant="outline" className="ws-control" onClick={() => setPayTarget({ closingId: closingEntry.id, line })}>
                        Mark paid
                      </Button>
                    ))}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <WsDialogContent>
          <DialogHeader>
            <DialogTitle>Close period</DialogTitle>
          </DialogHeader>
          <p className="m-0 text-sm">
            Close {report ? periodStartLabel(report.fromDate) : ''} to {to}. The amounts are locked and the next report starts after {to}.
          </p>
          <div className="grid gap-1.5">
            <Label htmlFor="branch-settlement-note">Note</Label>
            <Input id="branch-settlement-note" className="ws-control" value={closeNote} onChange={event => setCloseNote(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="ws-control" onClick={() => setCloseOpen(false)}>Cancel</Button>
            <Button className="ws-control" disabled={closing} onClick={() => void closePeriod()}>
              {closing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Close period
            </Button>
          </DialogFooter>
        </WsDialogContent>
      </Dialog>

      <Dialog open={!!payTarget} onOpenChange={open => !open && setPayTarget(null)}>
        <WsDialogContent>
          <DialogHeader>
            <DialogTitle>Mark paid</DialogTitle>
          </DialogHeader>
          {payTarget && (
            <p className="m-0 text-sm">
              {payTarget.line.fromBranchName} paid {payTarget.line.toBranchName} {amount(payTarget.line.amount)}.
            </p>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="branch-settlement-reference">Reference (cheque, transfer…)</Label>
            <Input id="branch-settlement-reference" className="ws-control" value={reference} onChange={event => setReference(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="ws-control" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button
              className="ws-control"
              disabled={paying || !reference.trim()}
              onClick={() => payTarget && void setPaid(payTarget.closingId, payTarget.line, true, reference.trim())}
            >
              {paying && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Mark paid
            </Button>
          </DialogFooter>
        </WsDialogContent>
      </Dialog>
    </WholesalePage>
  );
};

export default BranchSettlementReport;
