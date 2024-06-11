import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

import { cleanEntity } from 'app/shared/util/entity-utils';
import {
  IQueryParams,
  createEntitySlice,
  EntityState,
  serializeAxiosError,
  ChangeFieldPayload
} from "app/shared/reducers/reducer.utils";
import { IBrand } from "app/shared/model/brand.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";

const initialState: EntityState<IBrand> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: {},
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/brands';

const apiSearchUrl = 'api/_search/brands';

// Actions

export const searchEntities = createAsyncThunk('brand/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IBrand[]>(requestUrl);
});

export const filterEntities = createAsyncThunk('brand/filter_entity_list', async ({ query }: IQueryParams) => {
  return axios.post<IAddon[]>(apiSearchUrl, query);
});


export const getEntities = createAsyncThunk('brand/fetch_entity_list', async ({ id, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}` : '?'}`;
  return axios.get<IBrand[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'brand/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IBrand>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'brand/create_entity',
  async (entity: IBrand, thunkAPI) => {
    const result = await axios.post<IBrand>(apiUrl, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'brand/update_entity',
  async (entity: IBrand, thunkAPI) => {
    const result = await axios.put<IBrand>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'brand/partial_update_entity',
  async (entity: IBrand, thunkAPI) => {
    const result = await axios.patch<IBrand>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'brand/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IBrand>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<ChangeFieldPayload<IBrand>>('brand/change-entity-field');

// slice

export const BrandSlice = createEntitySlice({
  name: 'brand-slice',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const {name, value} = action.payload;
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
      .addMatcher(isFulfilled(getEntities, searchEntities, filterEntities), (state, action) => {
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
      .addMatcher(isPending(getEntities, getEntity, searchEntities, filterEntities), state => {
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

export const { reset } = BrandSlice.actions;

// Reducer
export default BrandSlice.reducer;
