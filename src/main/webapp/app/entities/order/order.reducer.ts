import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IOrder, defaultValue } from 'app/shared/model/ORDER/order.model';
import {IAuditLog} from "app/shared/model/audit-log.model";

const initialState: EntityState<IOrder> = {
  loading: false,
  errorMessage: null,
  entities: [],
  logs: [],
  entity: defaultValue,
  updating: false,
  updateSuccess: false,
  orderSources: []
};

const apiUrl = 'api/orders';
const apiSearchUrl = 'api/_search/orders';
const apiLogsUrl = 'api/orders'
// Actions

export const searchEntities = createAsyncThunk('order/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IOrder[]>(requestUrl);
});

export const getEntities = createAsyncThunk('order/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IOrder[]>(requestUrl);
});

export const getEntityLogs = createAsyncThunk('order-logs/fetch_entity_log_list', async ({ page, size, sort, id }: IQueryParams) => {
  const requestUrl = `${apiLogsUrl}/${id}/log${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IAuditLog[]>(requestUrl);
});


export const getOrderSources = createAsyncThunk('order/fetch_orderSource_list', async () => {
  const requestUrl = `/api/applications`;
  const response = await axios.get<IOrder[]>(requestUrl);
  return response
});

export const getOrderStatuses = createAsyncThunk('order/fetch_orderStatus_list', async () => {
  const requestUrl = `/api/orders/statuses`;
  const response = await axios.get<IOrder[]>(requestUrl);
  return response.data
});

// export const filterOrders = createAsyncThunk(
//   'order/filter_orders',
//   async ({ lazyState }: { lazyState: any }) => {
//     console.log(lazyState, 'hello')
//     const queryParams = {
//       ...lazyState.filters,
//       page: lazyState.page,
//       size: lazyState.rows,
//       sort: lazyState.sortField ? `${lazyState.sortField},${lazyState.sortOrder === 1 ? 'asc' : 'desc'}` : undefined,
//     };
//
//     const response = await  axios.get<IOrder[]>(`api/orders/filtered`, { params: queryParams });
//     console.log(response, 'response')
//     return response
//   }
// );

export const filterOrders = createAsyncThunk(
  'order/filter_orders',
  async (queryParams: any) => {
    try {
      const formData = new URLSearchParams(queryParams).toString();
      const response = await axios.post<IOrder[]>('api/orders/filtered', formData);
      return response;
    } catch (error) {
      throw new Error(error.message);
    }
  }
);



export const getEntity = createAsyncThunk(
  'order/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IOrder>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'order/create_entity',
  async (entity: IOrder, thunkAPI) => {
    const result = await axios.post<IOrder>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'order/update_entity',
  async (entity: IOrder, thunkAPI) => {
    const result = await axios.put<IOrder>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'order/partial_update_entity',
  async (entity: IOrder, thunkAPI) => {
    const result = await axios.patch<IOrder>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'order/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IOrder>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const OrderSlice = createEntitySlice({
  name: 'order',
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
      .addMatcher(isFulfilled(getEntityLogs), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          logs: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(getEntities, searchEntities,filterOrders), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalOrders: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(getOrderSources), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          orderSources: data,
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities,filterOrders), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity, filterOrders), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = OrderSlice.actions;

// Reducer
export default OrderSlice.reducer;
