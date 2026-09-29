import axios from 'axios';

import { IDiscount } from 'app/shared/model/discount.model';
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

const PAGE_SIZE = 100;
const MAX_ITEMS = 2000;

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
  limit: number,
): Promise<{ items: RestaurantBulkItem[]; capped: boolean }> => {
  const items: RestaurantBulkItem[] = [];
  let total = 0;
  let page = 0;
  do {
    const response = await axios.post<Omit<RestaurantBulkItem, 'kind'>[]>(SEARCH[kind], {
      rows: Math.min(PAGE_SIZE, limit - items.length),
      page,
      sortField: 'name',
      sortOrder: 1,
      filters,
    });
    total = Number(response.headers['x-total-count'] ?? items.length + response.data.length);
    items.push(...response.data.map(item => ({ ...item, kind })));
    page += 1;
  } while (items.length < total && items.length < limit);
  return { items, capped: total > items.length };
};

/** Loads restaurant items from the regular, pizza, and combo catalogs, up to MAX_ITEMS. */
export const searchRestaurantItems = async (
  filters: Record<string, { value: unknown; matchMode: string }>,
  kinds: RestaurantKind[],
): Promise<{ items: RestaurantBulkItem[]; capped: boolean }> => {
  const items: RestaurantBulkItem[] = [];
  let capped = false;
  for (const kind of kinds) {
    if (items.length >= MAX_ITEMS) {
      capped = true;
      break;
    }
    const result = await searchKind(kind, filters, MAX_ITEMS - items.length);
    items.push(...result.items);
    if (result.capped) capped = true;
  }
  return { items, capped };
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

export const loadOptions = async (url: string): Promise<NamedRef[]> => {
  const { data } = await axios.get<NamedRef[]>(url, { params: { page: 0, size: 500, sort: 'name,asc' } });
  return (data ?? []).filter(option => option?.id).map(option => ({ id: option.id, name: option.name ?? option.id }));
};

export const loadDiscounts = async (): Promise<IDiscount[]> => {
  const { data } = await axios.get<IDiscount[]>('api/discounts', { params: { page: 0, size: 500 } });
  return (data ?? []).filter(discount => discount?.id);
};
