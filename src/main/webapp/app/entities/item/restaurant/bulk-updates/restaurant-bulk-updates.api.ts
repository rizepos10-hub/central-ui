import axios from 'axios';

import { IDiscount } from 'app/shared/model/discount.model';
import { buildPostFilterSearchQuery } from 'app/shared/util/post-filter-search-util';
import { IVisibility } from 'app/shared/model/visibility.model';

export interface NamedRef {
  id: string;
  name: string;
}

export type RestaurantKind = 'regular' | 'pizza' | 'combo';

export interface RestaurantVariant {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  salePrice?: number | null;
  preparationTime?: number | null;
  accountingGroups?: NamedRef[] | null;
  discounts?: IDiscount[] | null;
  mixAndMatchRule?: NamedRef | null;
  skipAddonsPopup?: boolean;
}

/** A restaurant item plus which catalog it came from. `kind` is not sent back on save. */
export interface RestaurantBulkItem {
  kind: RestaurantKind;
  id?: string;
  name?: string;
  desc?: string | null;
  categories?: NamedRef[];
  brand?: NamedRef | null;
  tags?: NamedRef[];
  accountingGroups?: NamedRef[] | null;
  productionCenter?: NamedRef | null;
  visibility?: IVisibility[] | null;
  byWeight?: boolean;
  askForPrice?: boolean;
  excludedFromLoyaltyPoints?: boolean;
  skipAddonsPopup?: boolean;
  discounts?: IDiscount[] | null;
  variants?: RestaurantVariant[];
  [key: string]: unknown;
}

const SEARCH: Record<RestaurantKind, string> = {
  regular: 'api/_search/items/restaurant-variable',
  pizza: 'api/_search/items/restaurant-pizza',
  combo: 'api/_search/items/restaurant-combo',
};

const SAVE: Record<RestaurantKind, string> = {
  regular: 'api/items/restaurant-variable',
  pizza: 'api/items/restaurant-pizza',
  combo: 'api/items/restaurant-combo',
};

const searchKind = async (
  kind: RestaurantKind,
  filters: Record<string, { value: unknown; matchMode: string }>,
  page: number,
  rows: number,
): Promise<{ items: RestaurantBulkItem[]; total: number }> => {
  const response = await axios.post<Omit<RestaurantBulkItem, 'kind'>[]>(SEARCH[kind], {
    rows,
    page,
    sortField: 'name',
    sortOrder: 1,
    filters,
  });
  const total = Number(response.headers['x-total-count'] ?? response.data.length);
  return { items: response.data.map(item => ({ ...item, kind })), total };
};

/** Loads one page from each selected restaurant catalog. */
export const searchRestaurantItems = async (
  filters: Record<string, { value: unknown; matchMode: string }>,
  kinds: RestaurantKind[],
  page: number,
  rows: number,
): Promise<{ items: RestaurantBulkItem[]; total: number; pageCount: number }> => {
  const perKind = Math.max(1, Math.ceil(rows / kinds.length));
  const results = await Promise.all(kinds.map(kind => searchKind(kind, filters, page, perKind)));
  const total = results.reduce((sum, result) => sum + result.total, 0);
  const pageCount = Math.max(1, ...results.map(result => Math.ceil(result.total / perKind) || 0));
  return { items: results.flatMap(result => result.items), total, pageCount };
};

export const saveRestaurantItems = async (items: RestaurantBulkItem[]): Promise<void> => {
  const groups: Record<RestaurantKind, Omit<RestaurantBulkItem, 'kind'>[]> = { regular: [], pizza: [], combo: [] };
  items.forEach(item => {
    const { kind, ...payload } = item;
    groups[kind].push(payload);
  });
  await Promise.all(
    (Object.keys(groups) as RestaurantKind[])
      .filter(kind => groups[kind].length > 0)
      .map(kind => axios.put(SAVE[kind], groups[kind])),
  );
};

const byName = (left: NamedRef, right: NamedRef) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });

export const loadOptions = async (url: string): Promise<NamedRef[]> => {
  const { data } = await axios.get<NamedRef[]>(url, { params: { page: 0, size: 500, sort: 'name,asc' } });
  return (data ?? []).filter(option => option?.id).map(option => ({ id: option.id, name: option.name ?? option.id })).sort(byName);
};

/** Type-ahead category search, same endpoint the item list uses. */
export const searchNamedOptions = async (url: string, query: string): Promise<NamedRef[]> => {
  const { data } = await axios.post<NamedRef[]>(url, buildPostFilterSearchQuery({ query, page: 0, size: 30, sort: 'name,asc' }));
  return (data ?? []).filter(option => option?.id).map(option => ({ id: option.id, name: option.name ?? option.id })).sort(byName);
};

export const loadDiscounts = async (): Promise<IDiscount[]> => {
  const { data } = await axios.get<IDiscount[]>('api/discounts', { params: { page: 0, size: 500 } });
  return (data ?? []).filter(discount => discount?.id);
};
