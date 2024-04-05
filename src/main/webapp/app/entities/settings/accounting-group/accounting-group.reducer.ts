import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IAccountingGroup, defaultValue } from 'app/shared/model/TAX/accounting-groups.model';

const initialState: EntityState<IAccountingGroup> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/accounting-groups';
const apiSearchUrl = 'api/_search/accounting-groups';

// Actions

export const searchEntities = createAsyncThunk('accounting-groups/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IAccountingGroup[]>(requestUrl);
});

export const getEntities = createAsyncThunk('accounting-groups/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IAccountingGroup[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'accounting-groups/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
   const response = await  axios.get<IAccountingGroup>(requestUrl);

   console.log(response, 'mizo')
    return response
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'accounting-groups/create_entity',
  async (entity: IAccountingGroup, thunkAPI) => {
    const result = await axios.post<IAccountingGroup>(apiUrl, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'accounting-groups/update_entity',
  async (entity: IAccountingGroup, thunkAPI) => {
    const result = await axios.put<IAccountingGroup>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'accounting-groups/partial_update_entity',
  async (entity: IAccountingGroup, thunkAPI) => {
    const result = await axios.patch<IAccountingGroup>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'accounting-groups/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IAccountingGroup>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ fieldName: keyof IAccountingGroup; value: IAccountingGroup[keyof IAccountingGroup] }>('tax/change-entity-field');

// slice

export const AccountingGroupSlice = createEntitySlice({
  name: 'accounting-groups',
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

export const { reset } = AccountingGroupSlice.actions;

// Reducer
export default AccountingGroupSlice.reducer;
