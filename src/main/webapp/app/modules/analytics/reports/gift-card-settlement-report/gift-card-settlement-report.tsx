import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from 'app/modules/logistics/wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';

interface BranchLine {
  branchId: string;
  branchName: string;
  sharing: boolean;
  loaded: number;
  spent: number;
  owedToOthers: number;
  owedByOthers: number;
  net: number;
  heldAtEnd: number;
}

interface Settlement {
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  amount: number;
}

interface Report {
  branches: BranchLine[];
  settlements: Settlement[];
}

const amount = (value?: number) => (value == null ? '-' : Number(value).toFixed(2));

const startOfDay = (day: string) => new Date(`${day}T00:00:00`).toISOString();
const endOfDay = (day: string) => new Date(`${day}T23:59:59.999`).toISOString();

const firstOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
};

const GiftCardSettlementReport = () => {
  const today = new Date().toLocaleDateString('en-CA');
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<Report>('api/loyalty-cards/settlement-report', {
        params: { fromDate: startOfDay(from), toDate: endOfDay(to) },
      });
      setReport(data);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The report could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  const settlements = report?.settlements ?? [];
  const branches = report?.branches ?? [];
  const sharingCount = branches.filter(branch => branch.sharing).length;

  return (
    <WholesalePage
      title="Gift Card Settlement"
      context="What branches owe each other for gift cards spent at one branch with money another branch took in. Only branches with Share gift cards turned on in Branch Details are settled."
    >
      <section className="ws-card grid gap-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="gift-card-settlement-from">From</Label>
            <Input id="gift-card-settlement-from" className="ws-control" type="date" value={from} onChange={event => setFrom(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="gift-card-settlement-to">To</Label>
            <Input id="gift-card-settlement-to" className="ws-control" type="date" value={to} onChange={event => setTo(event.target.value)} />
          </div>
          <Button className="ws-control" disabled={loading} onClick={() => void search()}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
            Search
          </Button>
        </div>
        {report && sharingCount < 2 && (
          <p className="m-0 text-xs text-muted-foreground">
            Fewer than two branches share gift cards, so nothing is owed. Turn on Share gift cards in Branch Details, Gift Cards.
          </p>
        )}
      </section>

      <div className="ws-card overflow-auto">
        <table className="ws-table" aria-label="Who owes whom">
          <thead>
            <tr>
              <th>Branch that owes</th>
              <th>Owes to</th>
              <th className="ws-num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {!report && (
              <tr>
                <td colSpan={3} className="text-center text-muted-foreground">
                  Choose the dates and search.
                </td>
              </tr>
            )}
            {report && settlements.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-muted-foreground">
                  Nothing is owed between branches in this period.
                </td>
              </tr>
            )}
            {settlements.map(row => (
              <tr key={`${row.fromBranchId}-${row.toBranchId}`}>
                <td className="font-medium">{row.fromBranchName}</td>
                <td>{row.toBranchName}</td>
                <td className="ws-num">{amount(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report && branches.length > 0 && (
        <div className="ws-card overflow-auto">
          <table className="ws-table" aria-label="Gift cards by branch">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Sharing</th>
                <th className="ws-num">Loaded</th>
                <th className="ws-num">Spent here</th>
                <th className="ws-num">Owes others</th>
                <th className="ws-num">Owed by others</th>
                <th className="ws-num">Net</th>
                <th className="ws-num">Held at end</th>
              </tr>
            </thead>
            <tbody>
              {branches.map(branch => (
                <tr key={branch.branchId}>
                  <td className="font-medium">{branch.branchName}</td>
                  <td>
                    <WholesaleStatusBadge tone={branch.sharing ? 'approved' : 'neutral'}>{branch.sharing ? 'Sharing' : 'Not sharing'}</WholesaleStatusBadge>
                  </td>
                  <td className="ws-num">{amount(branch.loaded)}</td>
                  <td className="ws-num">{amount(branch.spent)}</td>
                  <td className="ws-num">{amount(branch.owedToOthers)}</td>
                  <td className="ws-num">{amount(branch.owedByOthers)}</td>
                  <td className="ws-num">{amount(branch.net)}</td>
                  <td className="ws-num">{amount(branch.heldAtEnd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="m-0 p-3 text-xs text-muted-foreground">
            Loaded is money put on cards at the branch. When a card is spent, the amount is taken from the branches holding its money in proportion to what each holds. Net above zero means
            other branches owe this branch. Held at end is card money the branch still holds on the To date.
          </p>
        </div>
      )}
    </WholesalePage>
  );
};

export default GiftCardSettlementReport;
