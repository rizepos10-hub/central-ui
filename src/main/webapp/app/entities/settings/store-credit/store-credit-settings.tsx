import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';
import { BranchStoreCreditSetting, StoreCreditSetting } from 'app/shared/model/store-credit.model';

interface Row extends BranchStoreCreditSetting {
  expiryText: string;
  dirty: boolean;
}

const toRow = (setting: BranchStoreCreditSetting): Row => ({
  ...setting,
  expiryText: setting.value?.defaultExpiryDays == null ? '' : String(setting.value.defaultExpiryDays),
  dirty: false,
});

const StoreCreditSettings = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<BranchStoreCreditSetting[]>('api/settings/store-credit');
      setRows((data ?? []).map(toRow));
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The store credit settings could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const change = (branchId: string, patch: Partial<StoreCreditSetting>, expiryText?: string) => {
    setRows(current =>
      current.map(row =>
        row.branchId === branchId
          ? { ...row, value: { ...row.value, ...patch }, expiryText: expiryText ?? row.expiryText, dirty: true }
          : row,
      ),
    );
  };

  const save = async (row: Row) => {
    const trimmed = row.expiryText.trim();
    const days = trimmed ? Number(trimmed) : null;
    if (days != null && (!Number.isInteger(days) || days < 1)) {
      toast.error('Expiry must be a whole number of days, or blank for never.');
      return;
    }
    setSavingId(row.branchId);
    try {
      const { data } = await axios.put<BranchStoreCreditSetting>(`api/settings/store-credit/${row.branchId}`, {
        key: 'STORE_CREDIT',
        enabled: row.value.enabled,
        defaultExpiryDays: days,
        redeemableOnline: row.value.redeemableOnline,
      });
      setRows(current => current.map(item => (item.branchId === row.branchId ? toRow(data) : item)));
      toast.success(`Saved ${row.branchName || 'branch'}.`);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The store credit settings could not be saved.'));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <WholesalePage
      title="Store Credit"
      context="Credit kept on a customer's profile from refunds or goodwill. The balance can be spent at any branch that has store credit on."
    >
      <div className="ws-card overflow-auto">
        <table className="ws-table" aria-label="Store credit settings">
          <thead>
            <tr>
              <th>Branch</th>
              <th>Store credit</th>
              <th>Default expiry (days)</th>
              <th>Redeemable online</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="text-center text-muted-foreground">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground">No branches.</td></tr>}
            {rows.map(row => (
              <tr key={row.branchId}>
                <td className="font-medium">{row.branchName || row.branchId}</td>
                <td>
                  <label className="flex items-center gap-2 text-[13px]">
                    <Checkbox checked={row.value.enabled} onCheckedChange={checked => change(row.branchId, { enabled: checked === true })} />
                    Enabled
                  </label>
                </td>
                <td>
                  <Input
                    className="ws-control w-28"
                    type="number"
                    min={1}
                    placeholder="Never"
                    value={row.expiryText}
                    onChange={event => change(row.branchId, {}, event.target.value)}
                  />
                </td>
                <td>
                  <label className="flex items-center gap-2 text-[13px]">
                    <Checkbox
                      checked={row.value.redeemableOnline}
                      disabled={!row.value.enabled}
                      onCheckedChange={checked => change(row.branchId, { redeemableOnline: checked === true })}
                    />
                    Online ordering
                  </label>
                </td>
                <td className="text-right">
                  <Button className="ws-control" disabled={!row.dirty || savingId === row.branchId} onClick={() => void save(row)}>
                    {savingId === row.branchId && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Default expiry applies to new credit; the cashier can override it when issuing. Credit is spent earliest-expiry first.
        Paying online with a linked loyalty card is controlled by the branch&apos;s Wallet payment setting.
      </p>
    </WholesalePage>
  );
};

export default StoreCreditSettings;
