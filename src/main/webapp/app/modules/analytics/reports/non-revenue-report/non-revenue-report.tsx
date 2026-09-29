import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';

interface ReportRow {
  accountId?: string;
  accountName?: string;
  deposits?: number;
  depositCount?: number;
  withdrawals?: number;
  withdrawalCount?: number;
  settlements?: number;
  settlementCount?: number;
  balance?: number;
  commission?: number;
  net?: number;
  balanceChange?: number;
}

interface Report {
  rows: ReportRow[];
  totals: ReportRow;
}

const amount = (value?: number) => (value == null ? '-' : Number(value).toFixed(2));

const startOfDay = (day: string) => new Date(`${day}T00:00:00`).toISOString();
const endOfDay = (day: string) => new Date(`${day}T23:59:59.999`).toISOString();

const NonRevenueReport = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<Report>('api/non-revenue-accounts/report', {
        params: { fromDate: startOfDay(from), toDate: endOfDay(to) },
      });
      setReport(data);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The report could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  const rows = report?.rows ?? [];
  const totals = report?.totals;

  return (
    <WholesalePage title="Non-Revenue Accounts" context="Deposits, withdrawals and settlements for money that is not a sale. Commission is your revenue. The balance is the amount still held at the end of the period, after commission.">
      <section className="ws-card grid gap-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="non-revenue-from">From</Label>
            <Input id="non-revenue-from" className="ws-control" type="date" value={from} onChange={event => setFrom(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="non-revenue-to">To</Label>
            <Input id="non-revenue-to" className="ws-control" type="date" value={to} onChange={event => setTo(event.target.value)} />
          </div>
          <Button className="ws-control" disabled={loading} onClick={() => void search()}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Search className="mr-1 h-4 w-4" />}
            Search
          </Button>
        </div>
      </section>
      <div className="ws-card overflow-auto">
        <table className="ws-table" aria-label="Non-revenue report">
          <thead>
            <tr>
              <th>Account</th>
              <th className="ws-num">Deposits</th>
              <th className="ws-num">Withdrawals</th>
              <th className="ws-num">Settlements</th>
              <th className="ws-num">Net</th>
              <th className="ws-num">Commission</th>
              <th className="ws-num">Balance</th>
            </tr>
          </thead>
          <tbody>
            {!report && <tr><td colSpan={7} className="text-center text-muted-foreground">Choose the dates and search.</td></tr>}
            {report && rows.length === 0 && <tr><td colSpan={7} className="text-center text-muted-foreground">No activity in this period.</td></tr>}
            {rows.map(row => (
              <tr key={row.accountId || row.accountName}>
                <td className="font-medium">{row.accountName}</td>
                <td className="ws-num">{amount(row.deposits)} <span className="text-muted-foreground">({row.depositCount ?? 0})</span></td>
                <td className="ws-num">{amount(row.withdrawals)} <span className="text-muted-foreground">({row.withdrawalCount ?? 0})</span></td>
                <td className="ws-num">{amount(row.settlements)} <span className="text-muted-foreground">({row.settlementCount ?? 0})</span></td>
                <td className="ws-num">{amount(row.net)}</td>
                <td className="ws-num">{amount(row.commission)}</td>
                <td className="ws-num">{amount(row.balance)}</td>
              </tr>
            ))}
            {totals && rows.length > 0 && (
              <tr>
                <td className="font-medium">Total</td>
                <td className="ws-num">{amount(totals.deposits)}</td>
                <td className="ws-num">{amount(totals.withdrawals)}</td>
                <td className="ws-num">{amount(totals.settlements)}</td>
                <td className="ws-num">{amount(totals.net)}</td>
                <td className="ws-num">{amount(totals.commission)}</td>
                <td className="ws-num">{amount(totals.balance)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WholesalePage>
  );
};

export default NonRevenueReport;
