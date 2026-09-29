import axios from 'axios';

import { IProduct } from 'app/shared/model/ITEM/retail/product.model';
import { buildPostFilterSearchQuery } from 'app/shared/util/post-filter-search-util';

export interface NamedRef {
  id: string;
  name: string;
}

/** Loads one page of retail products. */
export const searchRetailProducts = async (
  filters: Record<string, { value: unknown; matchMode: string }>,
  page: number,
  rows: number,
): Promise<{ items: IProduct[]; total: number }> => {
  const response = await axios.post<IProduct[]>('api/_search/items/retail', {
    rows,
    page,
    sortField: 'name',
    sortOrder: 1,
    filters,
  });
  const total = Number(response.headers['x-total-count'] ?? response.data.length);
  return { items: response.data, total };
};

export const saveRetailProducts = async (products: IProduct[]): Promise<void> => {
  await axios.put('api/items/retail', products);
};

const byName = (left: NamedRef, right: NamedRef) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });

export const loadOptions = async (url: string): Promise<NamedRef[]> => {
  const { data } = await axios.get<NamedRef[]>(url, { params: { page: 0, size: 500, sort: 'name,asc' } });
  return (data ?? []).filter(option => option?.id).map(option => ({ id: option.id, name: option.name ?? option.id })).sort(byName);
};

/** Type-ahead category search, same endpoint the product list uses. */
export const searchNamedOptions = async (url: string, query: string): Promise<NamedRef[]> => {
  const { data } = await axios.post<NamedRef[]>(url, buildPostFilterSearchQuery({ query, page: 0, size: 30, sort: 'name,asc' }));
  return (data ?? []).filter(option => option?.id).map(option => ({ id: option.id, name: option.name ?? option.id })).sort(byName);
};
