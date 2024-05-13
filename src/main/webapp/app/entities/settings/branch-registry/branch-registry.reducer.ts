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

export const getEntities = createAsyncThunk('branch-registry/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
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



// slice

export const BranchRegistrySlice = createEntitySlice({
  name: 'branch-registry',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
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
      .addMatcher(isPending(getEntities, getEntity, searchEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
    
  },
});

export const { reset } = BranchRegistrySlice.actions;

// Reducer
export default BranchRegistrySlice.reducer;
