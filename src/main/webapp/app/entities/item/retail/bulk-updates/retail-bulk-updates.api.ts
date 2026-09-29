import axios from 'axios';

import { IProduct } from 'app/shared/model/ITEM/retail/product.model';

export interface NamedRef {
  id: string;
  name: string;
}

const PAGE_SIZE = 100;
const MAX_ITEMS = 2000;

/** Loads every retail product matching the server filters, up to MAX_ITEMS. */
export const searchRetailProducts = async (filters: Record<string, { value: unknown; matchMode: string }>): Promise<{ items: IProduct[]; total: number; capped: boolean }> => {
  const items: IProduct[] = [];
  let total = 0;
  let page = 0;
  do {
    const response = await axios.post<IProduct[]>('api/_search/items/retail', {
      rows: PAGE_SIZE,
      page,
      sortField: 'name',
      sortOrder: 1,
      filters,
    });
    total = Number(response.headers['x-total-count'] ?? items.length + response.data.length);
    items.push(...response.data);
    page += 1;
  } while (items.length < total && items.length < MAX_ITEMS);
  return { items, total, capped: total > items.length };
};

export const saveRetailProducts = async (products: IProduct[]): Promise<void> => {
  await axios.put('api/items/retail', products);
};

export const loadOptions = async (url: string): Promise<NamedRef[]> => {
  const { data } = await axios.get<NamedRef[]>(url, { params: { page: 0, size: 500, sort: 'name,asc' } });
  return (data ?? []).filter(option => option?.id).map(option => ({ id: option.id, name: option.name ?? option.id }));
};
