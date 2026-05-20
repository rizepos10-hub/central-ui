import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IPurchaseOrderOrderableItem, defaultValue } from 'app/shared/model/STOCK/purchase-order-orderable-item.model';

const initialState: EntityState<IPurchaseOrderOrderableItem> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/inventory/suppliers';

type FetchOrderableItemsParams = {
  supplierId: string;
  locationId: string;
  query?: string;
  page?: number;
  size?: number;
};

export const getEntities = createAsyncThunk(
  'purchase-order-orderable-items/fetch_entity_list',
  async ({ supplierId, locationId, query, page, size }: FetchOrderableItemsParams) => {
    const params = new URLSearchParams();

    params.set('locationId', locationId);

    if (query) {
      params.set('query', query);
    }
    if (page != null) {
      params.set('page', String(page));
    }
    if (size != null) {
      params.set('size', String(size));
    }

    const requestUrl = `${apiUrl}/${supplierId}/orderable-items?${params.toString()}`;
    return axios.get<IPurchaseOrderOrderableItem[]>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const PurchaseOrderOrderableItemsSlice = createEntitySlice({
  name: 'purchase-order-orderable-items',
  initialState,
  extraReducers(builder) {
    builder
      .addMatcher(isFulfilled(getEntities), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10) || data.length,
        };
      })
      .addMatcher(isPending(getEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      });
  },
});

export const { reset } = PurchaseOrderOrderableItemsSlice.actions;

export default PurchaseOrderOrderableItemsSlice.reducer;
