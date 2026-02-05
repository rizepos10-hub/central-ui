import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IWholesaleRoute, defaultValue } from './logistics.model';

export interface RoutesQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  warehouseBranchId?: string;
  from?: string;
  to?: string;
}

const initialState: EntityState<IWholesaleRoute> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/wholesale/routes';

export const fetchRoutes = createAsyncThunk(
  'logistics/fetch_routes',
  async ({ page, size, sort, warehouseBranchId, from, to }: RoutesQueryParams) => {
    const params: Record<string, any> = {
      page,
      size,
      sort,
      warehouseBranchId,
      from,
      to,
      cacheBuster: new Date().getTime(),
    };
    return axios.get<IWholesaleRoute[]>(apiUrl, { params });
  },
  { serializeError: serializeAxiosError }
);

export const fetchRoute = createAsyncThunk(
  'logistics/fetch_route',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IWholesaleRoute>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createRoute = createAsyncThunk(
  'logistics/create_route',
  async (entity: IWholesaleRoute) => {
    return axios.post<IWholesaleRoute>(apiUrl, cleanEntity(entity));
  },
  { serializeError: serializeAxiosError }
);

export const updateRoute = createAsyncThunk(
  'logistics/update_route',
  async (entity: IWholesaleRoute) => {
    const requestUrl = `${apiUrl}/${entity.id}`;
    return axios.put<IWholesaleRoute>(requestUrl, cleanEntity(entity));
  },
  { serializeError: serializeAxiosError }
);

export const deleteRoute = createAsyncThunk(
  'logistics/delete_route',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.delete<IWholesaleRoute>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const LogisticsSlice = createEntitySlice({
  name: 'logistics',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(fetchRoute.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addMatcher(isFulfilled(fetchRoutes), (state, action) => {
        const { data, headers } = action.payload;
        state.loading = false;
        state.entities = data;
        state.totalItems = parseInt(headers['x-total-count'], 10) || 0;
      })
      .addMatcher(isFulfilled(createRoute, updateRoute, deleteRoute), (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = action.payload.data ?? {};
      })
      .addMatcher(isPending(fetchRoutes, fetchRoute), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createRoute, updateRoute, deleteRoute), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = LogisticsSlice.actions;

export default LogisticsSlice.reducer;
