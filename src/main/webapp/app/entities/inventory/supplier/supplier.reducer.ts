import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ISupplier, defaultValue } from 'app/shared/model/STOCK/supplier.model';

const initialState: EntityState<ISupplier> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/inventory/suppliers';
const apiSearchUrl = 'api/inventory/_search/suppliers';

// Actions

export const searchEntities = createAsyncThunk(
  'supplier/filter_entity_list',
  async ({ query }: IQueryParams & { query?: string | Record<string, unknown> }) => {
  return axios.post<ISupplier[]>(apiSearchUrl, query);
  }
);

export const getEntities = createAsyncThunk('supplier/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ISupplier[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'supplier/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ISupplier>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'supplier/create_entity',
  async (entity: ISupplier, thunkAPI) => {
    const result = await axios.post<ISupplier>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'supplier/update_entity',
  async (entity: ISupplier, thunkAPI) => {
    const result = await axios.put<ISupplier>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'supplier/partial_update_entity',
  async (entity: ISupplier, thunkAPI) => {
    const result = await axios.patch<ISupplier>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'supplier/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ISupplier>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// TODO: Uncomment when backend export API is implemented
// export const exportEntities = createAsyncThunk(
//   'supplier/export_entities',
//   async (ids: Array<string>, thunkAPI) => {
//     const requestUrl = `api/export-data/suppliers`;
//     
//     // Make the request and expect job information instead of blob
//     const response = await axios.post(requestUrl, ids);
//     
//     return response;
//   },
//   { serializeError: serializeAxiosError }
// );

// slice

export const SupplierSlice = createEntitySlice({
  name: 'supplier',
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
      .addMatcher(isFulfilled(getEntities, searchEntities), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity /* , exportEntities */), (state, action) => {
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
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity /* , exportEntities */), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = SupplierSlice.actions;

// Reducer
export default SupplierSlice.reducer;
