import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IPurchaseOrderSupplierItem, defaultValue } from 'app/shared/model/STOCK/purchase-order-supplier-item.model';

export type FetchSupplierItemsParams = {
  supplierId: string;
  page?: number;
  size?: number;
  name?: string;
  append?: boolean;
};

type SupplierItemsState = EntityState<IPurchaseOrderSupplierItem> & {
  loadingMore: boolean;
};

const initialState: SupplierItemsState = {
  loading: false,
  loadingMore: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/inventory/suppliers';

export const getEntities = createAsyncThunk(
  'purchase-order-supplier-items/fetch_entity_list',
  async ({ supplierId, page, size, name }: FetchSupplierItemsParams) => {
    const params = new URLSearchParams();

    if (page != null) {
      params.set('page', String(page));
    }
    if (size != null) {
      params.set('size', String(size));
    }
    if (name) {
      params.set('name', name);
    }

    const requestUrl = `${apiUrl}/${supplierId}/items?${params.toString()}`;
    return axios.get<IPurchaseOrderSupplierItem[]>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const PurchaseOrderSupplierItemsSlice = createEntitySlice({
  name: 'purchase-order-supplier-items',
  initialState,
  extraReducers(builder) {
    builder
      .addMatcher(isFulfilled(getEntities), (state, action) => {
        const { data, headers } = action.payload;
        const append = Boolean(action.meta.arg?.append);
        const parsedTotalItems = parseInt(headers['x-total-count'], 10);
        const totalItems = Number.isFinite(parsedTotalItems)
          ? parsedTotalItems
          : append
            ? state.totalItems || state.entities.length + data.length
            : data.length;

        if (append) {
          const existingIds = new Set(
            state.entities
              .map(entity => entity?.variantId || `${entity?.itemId}-${entity?.variantName}`)
              .filter(Boolean)
          );
          const merged = [...state.entities];

          data.forEach(item => {
            const rowKey = item?.variantId || `${item?.itemId}-${item?.variantName}`;
            if (rowKey && existingIds.has(rowKey)) {
              return;
            }
            if (rowKey) {
              existingIds.add(rowKey);
            }
            merged.push(item);
          });

          return {
            ...state,
            loading: false,
            loadingMore: false,
            entities: merged,
            totalItems: Number.isFinite(totalItems) ? totalItems : merged.length,
          };
        }

        return {
          ...state,
          loading: false,
          loadingMore: false,
          entities: data,
          totalItems: Number.isFinite(totalItems) ? totalItems : data.length,
        };
      })
      .addMatcher(isPending(getEntities), (state, action) => {
        state.errorMessage = null;
        state.updateSuccess = false;
        if (action.meta.arg?.append) {
          state.loadingMore = true;
        } else {
          state.loading = true;
          state.loadingMore = false;
        }
      });
  },
});

export const { reset } = PurchaseOrderSupplierItemsSlice.actions;

export default PurchaseOrderSupplierItemsSlice.reducer;
