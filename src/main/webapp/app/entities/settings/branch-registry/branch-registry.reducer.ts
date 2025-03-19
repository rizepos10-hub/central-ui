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
import { IBranchRegistry, defaultValue } from "app/shared/model/branch-registry.model";
import { IAddon } from "app/shared/model/ADDON/addon.model";

const initialState: EntityState<IBranchRegistry> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/branch-registries';
const apiSearchUrl = 'api/_search/branch-registries';

// Actions

export const searchEntities = createAsyncThunk('branch-registry/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IBranchRegistry[]>(requestUrl);
});

export const filterEntities = createAsyncThunk('branch-registry/filter_entity_list', async ({ query }: IQueryParams) => {
  return axios.post<IBranchRegistry[]>(apiSearchUrl, query);
});

export const getEntities = createAsyncThunk('branch-registry/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IBranchRegistry[]>(requestUrl);
});

export const getEntitiesByType = createAsyncThunk('branch-registry/fetch_entity_list', async ({ page, size, sort, type }: IQueryParams) => {
  const requestUrl = `${apiUrl}/by-type${sort ? `?page=${page}&size=${size}&sort=${sort}&type=${type}&` : '?'}cacheBuster=${new Date().getTime()}&type=${type}`;
  return axios.get<IBranchRegistry[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'branch-registry/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IBranchRegistry>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'brand/update_entity',
  async (entity: IBranchRegistry, thunkAPI) => {
    const result = await axios.put<IBranchRegistry['terminalSettings']>(`${apiUrl}/${entity.id}/update-settings`, cleanEntity(entity.terminalSettings));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<ChangeFieldPayload<IBranchRegistry>>('branch-registry/change-entity-field');
export const changeTerminalField = createAction<ChangeFieldPayload<any["terminalSettings"]>>('branch-registry/change-terminal-field');

// slice

const updateNestedState = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const deepObj = keys.reduce((acc, key) => acc[key] = acc[key] || {}, obj);
  deepObj[lastKey] = value;
  return { ...obj };
};

export const BranchRegistrySlice = createEntitySlice({
  name: 'branch-registry',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value;
      })
      .addCase(changeTerminalField, (state, action) => {
        const { name, value } = action.payload;
        state.entity.terminalSettings = updateNestedState(state.entity.terminalSettings, name, value);
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
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
      .addMatcher(isPending(getEntities, getEntity, searchEntities, filterEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })

  },
});

export const { reset } = BranchRegistrySlice.actions;

// Reducer
export default BranchRegistrySlice.reducer;
