import axios from 'axios';
import {createAction, createAsyncThunk, isFulfilled, isPending, isRejected} from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IServiceCharge, defaultValue } from 'app/shared/model/service-charge.model';

const initialState: EntityState<IServiceCharge> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/service-charge';
const apiSearchUrl = 'api/_search/service-charge';

// Actions

export const filterEntities = createAsyncThunk('settings/filter_entity_list', async ({ query }: IQueryParams) => {
  return axios.post<IServiceCharge[]>(apiSearchUrl, query);
});

export const getEntities = createAsyncThunk('settings/fetch_entity_list', async ({ page, size, sort, key, whenToApply, branchId }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}${key ? `&key=${key}` : ''}${whenToApply ? `&whenToApply=${whenToApply}` : ''}${branchId ? `&branchId=${branchId}` : ''}`;
  return axios.get<IServiceCharge[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'settings/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IServiceCharge>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'settings/create_entity',
  async (entity: IServiceCharge, thunkAPI) => {
    const result = await axios.post<IServiceCharge>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'settings/update_entity',
  async (entity: IServiceCharge, thunkAPI) => {
    const result = await axios.put<IServiceCharge>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'settings/partial_update_entity',
  async (entity: IServiceCharge, thunkAPI) => {
    const result = await axios.patch<IServiceCharge>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'settings/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IServiceCharge>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);


export const changeEntityField = createAction<{ name: string; value: any }>('settings/change-entity-field');

// slice

export const ServiceChargeSlice = createEntitySlice({
  name: 'settings',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value;
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addMatcher(isFulfilled(getEntities, filterEntities), (state, action) => {
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
      .addMatcher(isPending(getEntities, getEntity, filterEntities), state => {
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

export const { reset } = ServiceChargeSlice.actions;

// Reducer
export default ServiceChargeSlice.reducer;
