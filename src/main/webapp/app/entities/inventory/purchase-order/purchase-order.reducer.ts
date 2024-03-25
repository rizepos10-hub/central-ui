import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IPurchaseOrder, defaultValue } from 'app/shared/model/STOCK/purchase-order.model';
import {IAuditLog} from "app/shared/model/audit-log.model";

const initialState: EntityState<IPurchaseOrder> = {
  loading: false,
  errorMessage: null,
  entities: [],
  logs: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
  loadingLogs: false
};


const apiUrl = 'api/inventory/purchase-orders';
const apiSearchUrl = 'api/inventory/_search/purchase-orders';
const apiLogsUrl = 'api/purchase-orders'

// Actions

export const searchEntities = createAsyncThunk('purchase-order/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IPurchaseOrder[]>(requestUrl);
});

export const filterEntities = createAsyncThunk('purchase-order/filter_entity_list', async ({ page, size, sort, query }: IQueryParams) => {
  return axios.post<IPurchaseOrder[]>(apiSearchUrl, query);
});

export const getEntities = createAsyncThunk('purchase-order/fetch_entity_list', async ({ page, size, sort, query }: IQueryParams) => {
  const requestUrl = `${apiUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IPurchaseOrder[]>(requestUrl);
});

export const getEntityLogs = createAsyncThunk('purchase-order-logs/fetch_entity_log_list', async ({ page, size, sort, id }: IQueryParams) => {
  const requestUrl = `${apiLogsUrl}/${id}/logs${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IAuditLog[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'purchase-order/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IPurchaseOrder>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'purchase-order/create_entity',
  async (entity: { purchaseOrder: IPurchaseOrder, query?: any }, thunkAPI) => {
    const result = await axios.post<IPurchaseOrder>(apiUrl, cleanEntity(entity.purchaseOrder));
    thunkAPI.dispatch(getEntities({query: entity?.query}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const splitOrder = createAsyncThunk(
  'purchase-order/split_order',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/split-complete/${id}`;
    const result = await axios.post(requestUrl);
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'purchase-order/update_entity',
  async (entity: { purchaseOrder: IPurchaseOrder, query?: any }, thunkAPI) => {
    const result = await axios.put<IPurchaseOrder>(`${apiUrl}/${entity?.purchaseOrder?.id}`, cleanEntity(entity?.purchaseOrder));
    thunkAPI.dispatch(getEntities({query: entity?.query}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'purchase-order/partial_update_entity',
  async (entity: IPurchaseOrder, thunkAPI) => {
    const result = await axios.patch<IPurchaseOrder>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'purchase-order/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IPurchaseOrder>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const SalesLocationSlice = createEntitySlice({
  name: 'purchase-order',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addCase(getEntityLogs.pending, (state) => {
        state.loadingLogs = true;
      })
      .addMatcher(isFulfilled(getEntityLogs), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loadingLogs: false,
          logs: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(getEntities, searchEntities,filterEntities), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity,splitOrder), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities,filterEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity,splitOrder), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = SalesLocationSlice.actions;

// Reducer
export default SalesLocationSlice.reducer;
