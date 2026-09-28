import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/src/main/webapp/app/lib/utils';

import { WholesalePage } from '../wholesale-ui/wholesale-page';
import { WholesaleStatusBadge } from '../wholesale-ui/wholesale-status-badge';
import { wholesaleErrorMessage } from '../wholesale-ui/wholesale-error';
import { fetchWholesaleCustomers } from '../customers/wholesale-customer.api';
import { IWholesaleCustomer, customerName } from '../customers/wholesale-customer.model';
import { SalesmanEditor } from './salesman-editor';
import {
  assignCategory,
  assignCustomer,
  fetchAssignableCategories,
  fetchAssignedCustomers,
  fetchBranches,
  fetchCategoryAssignments,
  fetchSalesmen,
  unassignCategory,
  unassignCustomer,
} from './salesman.api';
import { IAssignableCategory, IAssignedCustomer, IBranchRef, ICategoryAssignment, ISalesman, newSalesman, salesmanName } from './salesman.model';

const PAGE_SIZE = 200;
const SEARCH_SIZE = 8;

const MANAGE_ROLES = [AUTHORITIES.ADMIN, AUTHORITIES.WHOLESALE_ADMIN, AUTHORITIES.WHOLESALE_SALES_MANAGER];

interface CustomersCardProps {
  salesman: ISalesman;
  canManage: boolean;
}

const CustomersCard = ({ salesman, canManage }: CustomersCardProps) => {
  const [assigned, setAssigned] = useState<IAssignedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<IWholesaleCustomer[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setAssigned([]);
    fetchAssignedCustomers(salesman.id)
      .then(list => current && setAssigned(list))
      .catch(error => current && toast.error(wholesaleErrorMessage(error, 'The assigned customers could not be loaded.')))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [salesman.id]);

  useEffect(() => {
    const text = search.trim();
    if (!text) {
      setResults([]);
      return undefined;
    }
    let current = true;
    const timer = setTimeout(() => {
      fetchWholesaleCustomers({ search: text, page: 0, size: SEARCH_SIZE })
        .then(found => current && setResults(found.items))
        .catch(() => current && setResults([]));
    }, 300);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [search]);

  const assignedIds = useMemo(() => new Set(assigned.map(a => a.customerId)), [assigned]);

  const add = async (customer: IWholesaleCustomer) => {
    setBusy(customer.id);
    try {
      const assignment = await assignCustomer(salesman.id, customer.id);
      setAssigned(prev => [
        ...prev.filter(a => a.customerId !== customer.id),
        { assignmentId: assignment.id, customerId: customer.id, name: customerName(customer), accountNumber: customer.accountNumber },
      ]);
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, `${customerName(customer)} could not be assigned.`));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (customer: IAssignedCustomer) => {
    setBusy(customer.customerId);
    try {
      await unassignCustomer(customer.assignmentId);
      setAssigned(prev => prev.filter(a => a.assignmentId !== customer.assignmentId));
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, `${customer.name} could not be removed.`));
    } finally {
      setBusy(null);
    }
  };

  const sorted = [...assigned].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section className="ws-card grid gap-3 p-4" aria-label="Customers">
      <div className="flex items-baseline gap-2">
        <h2 className="m-0 text-[15px] font-semibold">Customers</h2>
        <span className="text-xs text-muted-foreground">{loading ? 'Loading...' : `${assigned.length} assigned`}</span>
      </div>
      <p className="m-0 text-xs text-muted-foreground">They see only these customers in Order Entry, the Call List and Order Sheets.</p>

      {canManage && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Find a customer to assign"
            className="ws-control pl-8"
            placeholder="Find a wholesale customer to assign"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="mt-1 grid gap-0.5 rounded-md border bg-card p-1" aria-label="Search results">
              {results.map(c => (
                <li key={c.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
                  <span className="min-w-0 flex-1 truncate">{customerName(c)}</span>
                  {c.accountNumber && <span className="ws-mono text-xs text-muted-foreground">{c.accountNumber}</span>}
                  {assignedIds.has(c.id) ? (
                    <span className="text-xs text-muted-foreground">Assigned</span>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7" disabled={busy != null} onClick={() => add(c)} aria-label={`Assign ${customerName(c)}`}>
                      Assign
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!loading && assigned.length === 0 && (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No customers assigned yet, so this salesman has no one to order for.</div>
      )}
      {sorted.length > 0 && (
        <ul className="grid max-h-80 gap-0.5 overflow-y-auto" aria-label="Assigned customers">
          {sorted.map(c => (
            <li key={c.assignmentId} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {c.accountNumber && <span className="ws-mono text-xs text-muted-foreground">{c.accountNumber}</span>}
              {canManage && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={busy != null}
                  onClick={() => remove(c)}
                  aria-label={`Remove ${c.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

interface CategoriesCardProps {
  salesman: ISalesman;
  categories: IAssignableCategory[];
  canManage: boolean;
}

const CategoriesCard = ({ salesman, categories, canManage }: CategoriesCardProps) => {
  const [assignments, setAssignments] = useState<ICategoryAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setAssignments([]);
    fetchCategoryAssignments(salesman.id)
      .then(list => current && setAssignments(list))
      .catch(error => current && toast.error(wholesaleErrorMessage(error, 'The assigned categories could not be loaded.')))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [salesman.id]);

  const byCategory = useMemo(() => new Map(assignments.map(a => [a.categoryId, a])), [assignments]);
  const text = filter.trim().toLowerCase();
  const shown = categories.filter(c => !text || (c.name ?? '').toLowerCase().includes(text));

  const toggle = async (category: IAssignableCategory, on: boolean) => {
    setBusy(category.id);
    try {
      if (on) {
        const assignment = await assignCategory(salesman.id, category.id);
        setAssignments(prev => [...prev.filter(a => a.categoryId !== category.id), assignment]);
      } else {
        const existing = byCategory.get(category.id);
        if (existing) await unassignCategory(existing.id);
        setAssignments(prev => prev.filter(a => a.categoryId !== category.id));
      }
    } catch (error) {
      toast.error(wholesaleErrorMessage(error, `${category.name ?? 'The category'} could not be ${on ? 'assigned' : 'removed'}.`));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="ws-card grid gap-3 p-4" aria-label="Product categories">
      <div className="flex items-baseline gap-2">
        <h2 className="m-0 text-[15px] font-semibold">Product categories</h2>
        <span className="text-xs text-muted-foreground">{loading ? 'Loading...' : `${assignments.length} of ${categories.length} assigned`}</span>
      </div>
      <p className="m-0 text-xs text-muted-foreground">They can only order items from these categories.</p>
      {!loading && assignments.length === 0 && (
        <div className="rounded-md border border-[hsl(var(--ws-returned))] p-3 text-sm text-[hsl(var(--ws-returned))]">
          No categories assigned yet, so this salesman can&apos;t order any products.
        </div>
      )}
      <Input aria-label="Filter categories" className="ws-control" placeholder="Filter categories" value={filter} onChange={e => setFilter(e.target.value)} />
      <div className="grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2" role="group" aria-label="Categories">
        {shown.map(c => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={byCategory.has(c.id)}
              onCheckedChange={checked => toggle(c, checked === true)}
              disabled={!canManage || loading || busy != null}
              aria-label={c.name ?? c.id}
            />
            {c.name ?? c.id}
          </label>
        ))}
        {shown.length === 0 && <span className="text-xs text-muted-foreground">{categories.length ? 'No category matches.' : 'No categories yet.'}</span>}
      </div>
    </section>
  );
};

const WholesaleSalesmen = () => {
  const authorities = useAppSelector(state => state.authentication.account?.authorities ?? []);
  const canManage = hasAnyAuthority(authorities, MANAGE_ROLES);
  const [salesmen, setSalesmen] = useState<ISalesman[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [branches, setBranches] = useState<IBranchRef[]>([]);
  const [categories, setCategories] = useState<IAssignableCategory[]>([]);
  const [editing, setEditing] = useState<ISalesman | null>(null);

  useEffect(() => {
    fetchBranches()
      .then(setBranches)
      .catch(() => setBranches([]));
    fetchAssignableCategories()
      .then(setCategories)
      .catch(error => toast.error(wholesaleErrorMessage(error, 'The product categories could not be loaded.')));
  }, []);

  const latestRequest = useRef(0);

  const load = useCallback(async (select?: string) => {
    const request = ++latestRequest.current;
    setLoading(true);
    try {
      const result = await fetchSalesmen(0, PAGE_SIZE);
      if (request !== latestRequest.current) return;
      setSalesmen(result.items);
      setSelectedId(prev => select ?? (prev && result.items.some(s => s.id === prev) ? prev : (result.items[0]?.id ?? null)));
    } catch (error) {
      if (request === latestRequest.current) toast.error(wholesaleErrorMessage(error, 'The salesmen could not be loaded.'));
    } finally {
      if (request === latestRequest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = salesmen.find(s => s.id === selectedId) ?? null;
  const text = filter.trim().toLowerCase();
  const shown = salesmen.filter(s => !text || `${salesmanName(s)} ${s.email ?? ''} ${s.username ?? ''}`.toLowerCase().includes(text));

  const branchNames = (refs?: IBranchRef[]) =>
    (refs ?? []).map(r => r.name || branches.find(b => b.id === r.id)?.name || r.id).join(', ') || 'No branch';

  const onSaved = (saved: ISalesman) => {
    setEditing(null);
    load(saved.id);
  };

  return (
    <WholesalePage
      title="Salesmen"
      context="Who sells to which customers, and which product categories they can order"
      actions={
        canManage && (
          <Button className="ws-control" onClick={() => setEditing(newSalesman())}>
            <Plus className="mr-1 h-4 w-4" />
            New salesman
          </Button>
        )
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="ws-card grid gap-2 p-2">
          <Input aria-label="Filter salesmen" className="ws-control" placeholder="Filter salesmen" value={filter} onChange={e => setFilter(e.target.value)} />
          <ul className="grid gap-0.5" aria-label="Salesmen">
            {shown.map(s => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={s.id === selectedId}
                  onClick={() => setSelectedId(s.id)}
                  className={cn('w-full rounded-md px-2 py-1.5 text-left hover:bg-accent', s.id === selectedId && 'bg-accent font-semibold text-accent-foreground')}
                >
                  <div className="truncate text-sm">{salesmanName(s)}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.email || s.username}</div>
                </button>
              </li>
            ))}
          </ul>
          {!loading && salesmen.length === 0 && <div className="p-3 text-center text-sm text-muted-foreground">No salesmen yet.</div>}
          {!loading && salesmen.length > 0 && shown.length === 0 && <div className="p-3 text-center text-sm text-muted-foreground">No salesman matches.</div>}
          {loading && <div className="p-3 text-center text-sm text-muted-foreground">Loading salesmen...</div>}
        </div>

        {selected ? (
          <div className="grid gap-4">
            <section className="ws-card flex flex-wrap items-start gap-3 p-4" aria-label="Details">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="m-0 text-[15px] font-semibold">{salesmanName(selected)}</h2>
                  <WholesaleStatusBadge tone={selected.enabled === false ? 'neutral' : 'approved'}>
                    {selected.enabled === false ? 'Disabled' : 'Active'}
                  </WholesaleStatusBadge>
                </div>
                <div className="mt-1 text-[13px] text-muted-foreground">
                  {selected.email || '-'} · <span className="ws-mono">{selected.username}</span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">Branches: {branchNames(selected.branches)}</div>
              </div>
              {canManage && (
                <Button variant="outline" className="ws-control" onClick={() => setEditing(selected)}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit details
                </Button>
              )}
            </section>
            <CustomersCard salesman={selected} canManage={canManage} />
            <CategoriesCard salesman={selected} categories={categories} canManage={canManage} />
          </div>
        ) : (
          !loading && (
            <div className="ws-card p-6 text-center text-sm text-muted-foreground">
              {salesmen.length ? 'Pick a salesman to see their customers and categories.' : 'Add a salesman to assign customers and categories.'}
            </div>
          )
        )}
      </div>

      <SalesmanEditor salesman={editing} branches={branches} onClose={() => setEditing(null)} onSaved={onSaved} />
    </WholesalePage>
  );
};

export default WholesaleSalesmen;
