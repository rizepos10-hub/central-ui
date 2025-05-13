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
import { ITerm, defaultValue } from 'app/shared/model/term.model';
import { IUiSettings } from "app/shared/model/ONLINE_ORDERING/ui-setting.model";

const initialState: EntityState<ITerm> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/retail-categories';
const apiSearchUrl = 'api/_search/retail-categories';

// Actions

export const searchEntities = createAsyncThunk('retail-category-tree/search_entity', async ({ query, page, size, sort, taxonomyName }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?name=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}${taxonomyName ? `&name=${encodeURIComponent(taxonomyName)}` : ''}`;
  return axios.get<ITerm[]>(requestUrl);
});

export const getEntities = createAsyncThunk('retail-category-tree/fetch_entity_list', async ({ page, size, sort, taxonomyName }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}?` : '?'}cacheBuster=${new Date().getTime()}`;
  return  axios.get<ITerm[]>(requestUrl);
});


export const getEntity = createAsyncThunk(
  'retail-category-tree/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ITerm>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);




export const createEntity = createAsyncThunk(
  'retail-category-tree/create_entity',
  async (entity: ITerm, thunkAPI) => {
    const result = await axios.post<ITerm>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);



export const updateEntity = createAsyncThunk(
  'retail-category-tree/update_entity',
  async (entity: ITerm, thunkAPI) => {
    const result = await axios.put<ITerm>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'retail-category-tree/partial_update_entity',
  async (entity: ITerm, thunkAPI) => {
    const result = await axios.patch<ITerm>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'retail-category-tree/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ITerm>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<ChangeFieldPayload<ITerm>>('retail-category-tree/change-entity-field');




// slice

export const RetailCategoryTreeSlice = createEntitySlice({
  name: 'retail-category-tree',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value
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

export const { reset } = RetailCategoryTreeSlice.actions;

// Reducer
export default RetailCategoryTreeSlice.reducer;
