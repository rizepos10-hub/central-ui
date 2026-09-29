import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WholesalePage } from 'app/modules/logistics/wholesale-ui/wholesale-page';
import { WsSelectContent } from 'app/modules/logistics/wholesale-ui/wholesale-overlays';
import { wholesaleErrorMessage } from 'app/modules/logistics/wholesale-ui/wholesale-error';
import {
  emptyAccount,
  emptyRules,
  NonRevenueAccount,
  NonRevenueAmountMode,
  NonRevenueApproval,
  NonRevenueCommissionBase,
  NonRevenueDirection,
} from 'app/shared/model/non-revenue-account.model';

interface BranchOption {
  id: string;
  name: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'debit', label: 'Debit' },
  { value: 'visa', label: 'Visa' },
  { value: 'master', label: 'Mastercard' },
  { value: 'amex', label: 'Amex' },
  { value: 'discover', label: 'Discover' },
  { value: 'giftCard', label: 'Gift card' },
  { value: 'storeCredit', label: 'Store credit' },
];

const money = (value: number | null | undefined) => (value == null || Number.isNaN(value) ? '' : String(value));

const parseOptional = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) ? number : null;
};

const NonRevenueAccounts = () => {
  const [accounts, setAccounts] = useState<NonRevenueAccount[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [draft, setDraft] = useState<NonRevenueAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get<NonRevenueAccount[]>('api/non-revenue-accounts');
      setAccounts([...(data ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)));
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The accounts could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    axios
      .get<BranchOption[]>('api/branches', { params: { page: 0, size: 500, sort: 'name,asc' } })
      .then(({ data }) => setBranches((data ?? []).filter(branch => branch?.id).map(branch => ({ id: branch.id, name: branch.name || branch.id }))))
      .catch(() => setBranches([]));
  }, []);

  const updateRules = (patch: Partial<NonRevenueAccount['rules']>) => {
    setDraft(current => (current ? { ...current, rules: { ...current.rules, ...patch } } : current));
  };

  const save = async () => {
    if (!draft?.name.trim()) {
      toast.error('Enter a name.');
      return;
    }
    if (draft.rules.amountMode === 'FIXED' && (draft.rules.fixedAmount == null || draft.rules.fixedAmount < 0)) {
      toast.error('Enter the fixed amount.');
      return;
    }
    if (draft.rules.amountMode === 'DENOMINATIONS' && draft.rules.denominations.length === 0) {
      toast.error('Enter at least one denomination.');
      return;
    }
    if (draft.commissionPercent != null && (draft.commissionPercent < 0 || draft.commissionPercent > 100)) {
      toast.error('Commission must be between 0 and 100%.');
      return;
    }
    setSaving(true);
    try {
      const body = { ...draft, name: draft.name.trim(), rules: { ...emptyRules(), ...draft.rules } };
      if (draft.id) await axios.put(`api/non-revenue-accounts/${draft.id}`, body);
      else await axios.post('api/non-revenue-accounts', { ...body, id: undefined });
      setDraft(null);
      await load();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The account could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const archive = async (account: NonRevenueAccount) => {
    if (!account.id || !window.confirm(`Archive ${account.name}?`)) return;
    try {
      await axios.delete(`api/non-revenue-accounts/${account.id}`);
      if (draft?.id === account.id) setDraft(null);
      await load();
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, 'The account could not be archived.'));
    }
  };

  return (
    <WholesalePage
      title="Non-Revenue Accounts"
      context="Money held for someone else, such as lottery or phone cards. These amounts are not sales."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="ws-card overflow-auto">
          <table className="ws-table" aria-label="Non-revenue accounts">
            <thead>
              <tr>
                <th>Name</th>
                <th>Direction</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={4} className="text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && accounts.length === 0 && <tr><td colSpan={4} className="text-center text-muted-foreground">No accounts yet.</td></tr>}
              {accounts.map(account => (
                <tr key={account.id}>
                  <td className="font-medium">{account.name}</td>
                  <td>{account.rules?.direction || 'BOTH'}</td>
                  <td>{account.rules?.amountMode || 'OPEN'}</td>
                  <td className="text-right">
                    <Button variant="outline" className="ws-control mr-2" onClick={() => setDraft({ ...emptyAccount(), ...account, rules: { ...emptyRules(), ...account.rules } })}>Edit</Button>
                    <Button variant="outline" className="ws-control" onClick={() => void archive(account)}>Archive</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="ws-card grid gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-sm font-semibold">{draft?.id ? 'Edit account' : 'New account'}</h2>
            <Button variant="outline" className="ws-control" onClick={() => setDraft(emptyAccount())}>New</Button>
          </div>
          {!draft && <p className="m-0 text-xs text-muted-foreground">Choose an account, or create one.</p>}
          {draft && (
            <>
              <Field label="Name">
                <Input className="ws-control" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
              </Field>
              {draft.rules.direction !== 'WITHDRAWAL' && (
                <Field label="Deposit label">
                  <Input className="ws-control" placeholder="Lottery" value={draft.receiptLabel ?? ''} onChange={event => setDraft({ ...draft, receiptLabel: event.target.value })} />
                </Field>
              )}
              {draft.rules.direction !== 'DEPOSIT' && (
                <Field label="Withdrawal label">
                  <Input className="ws-control" placeholder="Lottery Paid Out" value={draft.withdrawalLabel ?? ''} onChange={event => setDraft({ ...draft, withdrawalLabel: event.target.value })} />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Color">
                  <Input className="ws-control" placeholder="#336699" value={draft.color ?? ''} onChange={event => setDraft({ ...draft, color: event.target.value })} />
                </Field>
                <Field label="Sort">
                  <Input className="ws-control" type="number" value={money(draft.sortOrder)} onChange={event => setDraft({ ...draft, sortOrder: parseOptional(event.target.value) })} />
                </Field>
              </div>
              <Choice label="Direction" value={draft.rules.direction} options={['BOTH', 'DEPOSIT', 'WITHDRAWAL']} onChange={value => updateRules({ direction: value as NonRevenueDirection })} />
              <Choice label="Amount" value={draft.rules.amountMode} options={['OPEN', 'FIXED', 'DENOMINATIONS']} onChange={value => updateRules({ amountMode: value as NonRevenueAmountMode })} />
              {draft.rules.amountMode === 'FIXED' && (
                <Field label="Fixed amount">
                  <Input className="ws-control" type="number" min={0} step="0.01" value={money(draft.rules.fixedAmount)} onChange={event => updateRules({ fixedAmount: parseOptional(event.target.value) })} />
                </Field>
              )}
              {draft.rules.amountMode === 'DENOMINATIONS' && (
                <Field label="Denominations">
                  <Input className="ws-control" placeholder="1, 5, 10" value={draft.rules.denominations.join(', ')} onChange={event => updateRules({ denominations: event.target.value.split(',').map(part => Number(part.trim())).filter(number => Number.isFinite(number)) })} />
                </Field>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Field label="Minimum">
                  <Input className="ws-control" type="number" min={0} step="0.01" value={money(draft.rules.minAmount)} onChange={event => updateRules({ minAmount: parseOptional(event.target.value) })} />
                </Field>
                <Field label="Maximum">
                  <Input className="ws-control" type="number" min={0} step="0.01" value={money(draft.rules.maxAmount)} onChange={event => updateRules({ maxAmount: parseOptional(event.target.value) })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Commission %">
                  <Input className="ws-control" type="number" min={0} max={100} step="0.01" placeholder="0" value={money(draft.commissionPercent)} onChange={event => setDraft({ ...draft, commissionPercent: parseOptional(event.target.value) })} />
                </Field>
                <Choice label="Commission on" value={draft.commissionAppliesTo} options={['DEPOSITS', 'WITHDRAWALS', 'BOTH']} onChange={value => setDraft({ ...draft, commissionAppliesTo: value as NonRevenueCommissionBase })} />
              </div>
              <p className="m-0 -mt-1 text-xs text-muted-foreground">The commission is your revenue. The report deducts it from the amount you owe.</p>
              <Choice label="Approval" value={draft.rules.approval} options={['NONE', 'WITHDRAWAL', 'OVER_LIMIT', 'ALWAYS']} onChange={value => updateRules({ approval: value as NonRevenueApproval })} />
              {draft.rules.approval === 'OVER_LIMIT' && (
                <Field label="Approval above">
                  <Input className="ws-control" type="number" min={0} step="0.01" value={money(draft.rules.approvalLimit)} onChange={event => updateRules({ approvalLimit: parseOptional(event.target.value) })} />
                </Field>
              )}
              <div className="grid gap-1.5">
                <Label>Payment methods</Label>
                <p className="m-0 text-xs text-muted-foreground">None selected means every method is allowed.</p>
                {PAYMENT_METHODS.map(method => (
                  <label key={method.value} className="flex items-center gap-2 text-[13px]">
                    <Checkbox
                      checked={draft.rules.allowedPaymentMethods.includes(method.value)}
                      onCheckedChange={checked => updateRules({
                        allowedPaymentMethods: checked === true
                          ? [...draft.rules.allowedPaymentMethods, method.value]
                          : draft.rules.allowedPaymentMethods.filter(current => current !== method.value),
                      })}
                    />
                    {method.label}
                  </label>
                ))}
              </div>
              <div className="grid gap-1.5">
                <Label>Branches</Label>
                <p className="m-0 text-xs text-muted-foreground">None selected means every branch.</p>
                <div className="max-h-32 overflow-auto">
                  {branches.map(branch => (
                    <label key={branch.id} className="flex items-center gap-2 text-[13px]">
                      <Checkbox
                        checked={draft.branchIds.includes(branch.id)}
                        onCheckedChange={checked => setDraft({
                          ...draft,
                          branchIds: checked === true ? [...draft.branchIds, branch.id] : draft.branchIds.filter(id => id !== branch.id),
                        })}
                      />
                      {branch.name}
                    </label>
                  ))}
                </div>
              </div>
              <Toggle label="Allow with other items" checked={draft.rules.allowMixedBasket} onChange={allowMixedBasket => updateRules({ allowMixedBasket })} />
              <Toggle label="Can move between bills" checked={draft.rules.movableBetweenBills} onChange={movableBetweenBills => updateRules({ movableBetweenBills })} />
              <Toggle label="Cash out the excess" checked={draft.rules.cashOutExcess} onChange={cashOutExcess => updateRules({ cashOutExcess })} />
              <Toggle label="Require a reference" checked={draft.rules.requireReference} onChange={requireReference => updateRules({ requireReference })} />
              <Toggle label="Require a customer" checked={draft.rules.requireCustomer} onChange={requireCustomer => updateRules({ requireCustomer })} />
              <Toggle label="Refundable" checked={draft.rules.refundable} onChange={refundable => updateRules({ refundable })} />
              <Toggle label="Age check" checked={draft.rules.ageCheck} onChange={ageCheck => updateRules({ ageCheck })} />
              {draft.rules.ageCheck && (
                <Field label="Minimum age">
                  <Input className="ws-control" type="number" min={0} value={money(draft.rules.minimumAge)} onChange={event => updateRules({ minimumAge: parseOptional(event.target.value) })} />
                </Field>
              )}
              <Button className="ws-control" disabled={saving} onClick={() => void save()}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </>
          )}
        </section>
      </div>
    </WholesalePage>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid gap-1.5">
    <Label>{label}</Label>
    {children}
  </div>
);

const Choice = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => (
  <Field label={label}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="ws-control"><SelectValue /></SelectTrigger>
      <WsSelectContent>
        {options.map(option => <SelectItem key={option} value={option}>{option.replace(/_/g, ' ')}</SelectItem>)}
      </WsSelectContent>
    </Select>
  </Field>
);

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
  <label className="flex items-center gap-2 text-[13px]">
    <Checkbox checked={checked} onCheckedChange={value => onChange(value === true)} />
    {label}
  </label>
);

export default NonRevenueAccounts;
