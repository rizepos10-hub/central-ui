import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

import { cleanEntity } from 'app/shared/util/entity-utils';
import {
  IQueryParams,
  createEntitySlice,
  EntityState,
  serializeAxiosError,
} from "app/shared/reducers/reducer.utils";
import { IProfileGroup, defaultValue } from 'app/shared/model/TAX/profile-group.model';
import { buildPostFilterSearchQuery } from 'app/shared/util/post-filter-search-util';

const initialState: EntityState<IProfileGroup> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/accounting-groups';
const apiSearchUrl = 'api/accounting-groups/_search';

// Actions

export const searchEntities = createAsyncThunk('profile-group/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  return axios.post<IProfileGroup[]>(
    apiSearchUrl,
    buildPostFilterSearchQuery({
      query,
      page,
      size,
      sort,
      field: 'name',
    })
  );
});

export const getEntities = createAsyncThunk('profile-group/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IProfileGroup[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'profile-group/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return await  axios.get<IProfileGroup>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'profile-group/create_entity',
  async (entity: IProfileGroup, thunkAPI) => {
    const result = await axios.post<IProfileGroup>(apiUrl, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'profile-group/update_entity',
  async (entity: IProfileGroup, thunkAPI) => {
    const result = await axios.put<IProfileGroup>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'profile-group/partial_update_entity',
  async (entity: IProfileGroup, thunkAPI) => {
    const result = await axios.patch<IProfileGroup>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'profile-group/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IProfileGroup>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ fieldName: keyof IProfileGroup; value: IProfileGroup[keyof IProfileGroup] }>('tax/change-entity-field');

// slice

export const ProfileGroupSlice = createEntitySlice({
  name: 'accounting-group',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { fieldName, value } = action.payload;
        state.entity[fieldName] = value;
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

export const { reset } = ProfileGroupSlice.actions;

// Reducer
export default ProfileGroupSlice.reducer;
