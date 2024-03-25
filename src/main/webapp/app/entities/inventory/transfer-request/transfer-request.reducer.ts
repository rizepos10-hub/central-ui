import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ITransferRequest, defaultValue } from 'app/shared/model/STOCK/transfer-request.model';
import {IAuditLog} from "app/shared/model/audit-log.model";

const initialState: EntityState<ITransferRequest> = {
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

const apiUrl = 'api/inventory/transfer-requests';
const apiSearchUrl = 'api/_search/inventory/transfer-requests';
const apiLogsUrl = 'api/transfer-requests'
// Actions

export const searchEntities = createAsyncThunk('transfer-request/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<ITransferRequest[]>(requestUrl);
});

export const getEntities = createAsyncThunk('transfer-request/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ITransferRequest[]>(requestUrl);
});

export const getEntityLogs = createAsyncThunk('transfer-request-logs/fetch_entity_log_list', async ({ page, size, sort, id }: IQueryParams) => {
  const requestUrl = `${apiLogsUrl}/${id}/logs${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IAuditLog[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'transfer-request/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ITransferRequest>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'transfer-request/create_entity',
  async (entity: ITransferRequest, thunkAPI) => {
    const result = await axios.post<ITransferRequest>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'transfer-request/update_entity',
  async (entity: ITransferRequest, thunkAPI) => {
    const result = await axios.put<ITransferRequest>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'transfer-request/partial_update_entity',
  async (entity: ITransferRequest, thunkAPI) => {
    const result = await axios.patch<ITransferRequest>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'transfer-request/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ITransferRequest>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const TransferRequestSlice = createEntitySlice({
  name: 'transfer-request',
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
      .addCase(getEntityLogs.pending, (state, action) => {
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
      .addMatcher(isFulfilled(getEntities, searchEntities), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = TransferRequestSlice.actions;

// Reducer
export default TransferRequestSlice.reducer;
