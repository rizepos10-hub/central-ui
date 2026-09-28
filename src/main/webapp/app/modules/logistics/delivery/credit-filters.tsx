import React from 'react';

import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { WsSelectContent } from '../wholesale-ui/wholesale-overlays';
import { IWholesaleRouteDefinition } from '../customers/wholesale-customer.model';
import { addDays, toIsoDate } from '../closures/closure.model';
import { ICreditFilters } from './delivery.model';

export const ANY = '__any';

export interface FilterOption {
  value: string;
  label: string;
}

/** The last seven delivery days, today included. */
export const lastWeek = (now = new Date()): ICreditFilters => {
  const to = toIsoDate(now);
  return { from: addDays(to, -6), to };
};

/** Options seen in the results, kept while that filter is set so the chosen one stays listed. */
export const optionsFrom = <T,>(rows: T[], value: (row: T) => string | null | undefined, label: (row: T) => string | null | undefined): FilterOption[] => {
  const seen = new Map<string, string>();
  rows.forEach(row => {
    const v = value(row);
    if (v && !seen.has(v)) seen.set(v, label(row) || v);
  });
  return Array.from(seen, ([v, l]) => ({ value: v, label: l })).sort((a, b) => a.label.localeCompare(b.label));
};

const Picker = ({ label, value, options, anyLabel, onChange }: { label: string; value?: string | null; options: FilterOption[]; anyLabel: string; onChange: (value: string | null) => void }) => (
  <Select value={value ?? ANY} onValueChange={v => onChange(v === ANY ? null : v)}>
    <SelectTrigger className="ws-control w-48" aria-label={label}>
      <SelectValue />
    </SelectTrigger>
    <WsSelectContent>
      <SelectItem value={ANY}>{anyLabel}</SelectItem>
      {options.map(o => (
        <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
    </WsSelectContent>
  </Select>
);

interface CreditFilterBarProps {
  filters: ICreditFilters;
  onChange: (filters: ICreditFilters) => void;
  routes: IWholesaleRouteDefinition[];
  customers: FilterOption[];
  products?: FilterOption[];
  children?: React.ReactNode;
}

/** Delivery date range, route and customer, plus the product when [products] is given; filters combine on the server. */
export const CreditFilterBar = ({ filters, onChange, routes, customers, products, children }: CreditFilterBarProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <Input
      type="date"
      aria-label="From"
      className="ws-control w-40"
      value={filters.from}
      max={filters.to}
      onChange={e => e.target.value && onChange({ ...filters, from: e.target.value })}
    />
    <span className="text-sm text-muted-foreground">to</span>
    <Input
      type="date"
      aria-label="To"
      className="ws-control w-40"
      value={filters.to}
      min={filters.from}
      onChange={e => e.target.value && onChange({ ...filters, to: e.target.value })}
    />
    <Picker
      label="Route"
      value={filters.routeDefinitionId}
      anyLabel="All routes"
      options={routes.map(r => ({ value: r.id, label: r.name ?? r.id }))}
      onChange={routeDefinitionId => onChange({ ...filters, routeDefinitionId })}
    />
    <Picker label="Customer" value={filters.customerId} anyLabel="All customers" options={customers} onChange={customerId => onChange({ ...filters, customerId })} />
    {products && <Picker label="Product" value={filters.itemId} anyLabel="All products" options={products} onChange={itemId => onChange({ ...filters, itemId })} />}
    {children}
  </div>
);

export const SelectFilter = Picker;
