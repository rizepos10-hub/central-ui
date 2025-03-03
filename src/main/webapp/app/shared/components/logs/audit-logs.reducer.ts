import axios from 'axios';
import {createAsyncThunk, createSlice, isFulfilled, isPending, isRejected} from '@reduxjs/toolkit';

import {
  IQueryParams,
  serializeAxiosError,
  AuditLogState
} from 'app/shared/reducers/reducer.utils';
import {IAuditLog} from "app/shared/model/audit-log.model";

const initialState: AuditLogState = {
  loading: false,
  errorMessage: null,
  logs: [],
  totalItems: 0,
};

const apiUrl = 'api/logs';

// Actions



export const getEntityLogs = createAsyncThunk('get-entity-logs/fetch_entity_log_list', async ({ page, size, sort, id, action }: IQueryParams) => {
  const requestUrl = `${apiUrl}?${id ? `entityId=${id}` : ''}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}&${action ? `action=${action}` : ''}`;
  return axios.get<IAuditLog[]>(requestUrl);
},
  { serializeError: serializeAxiosError }
);




// slice

export const AuditLogsSlice = createSlice({
  name: 'audit-logs',
  initialState,
  reducers: {
    reset() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getEntityLogs.pending, (state, action) => {
        state.loading = true;
      })
      .addCase(getEntityLogs.rejected, (state, action) => {
        state.loading = false
        state.errorMessage = action.error.message
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
  },
});

export const { reset } = AuditLogsSlice.actions;

// Reducer
export default AuditLogsSlice.reducer;
