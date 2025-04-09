import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';

import { IProduct, defaultValue } from "app/shared/model/ITEM/retail/product.model";
import { IVariableItem } from "app/shared/model/ITEM/retail/variable-item.model";
import { cleanEntity } from "app/shared/util/entity-utils";
import { ISimpleItem } from "app/shared/model/ITEM/retail/simple-item.model";
const initialState: EntityState<IProduct> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/items/retail';
const apiSearchUrl = 'api/_search/items/retail';

// Actions

export const filterEntities = createAsyncThunk('product/filter_entity_list', async ({ query, }: IQueryParams) => {
  return axios.post<IProduct[]>(apiSearchUrl, query);
});

export const getEntities = createAsyncThunk('product/fetch_entity_list', async ({ page, size, sort, name }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&name=${name}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IProduct[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'product/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IProduct>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'product/create_entity',
  async (entity: IProduct, thunkAPI) => {
    const result = await axios.post<IProduct>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'product/update_entity',
  async (entity: IProduct, thunkAPI) => {
    const result = await axios.put<IProduct>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntity(entity.id));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntities = createAsyncThunk(
  'product/update_entity',
  async (
    { entity, query }: { entity: IProduct[]; query: any },
    thunkAPI
  ) => {
    const result = await axios.put<IProduct[]>(`${apiUrl}`, entity);
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'product/partial_update_entity',
  async (entity: IProduct, thunkAPI) => {
    const result = await axios.patch<IProduct>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);


// export const deleteEntity = createAsyncThunk(
//   'product/delete_entity',
//   async (id: string | number, thunkAPI) => {
//     const requestUrl = `${apiUrl}/${id}`;
//     const result = await axios.delete<IProduct>(requestUrl);
//     thunkAPI.dispatch(getEntities({}));
//     return result;
//   },
//   { serializeError: serializeAxiosError }
// );

export const archiveEntity = createAsyncThunk(
  'product/archive_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}/archive`;
    const result = await axios.patch<IProduct>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const purgeEntities = createAsyncThunk(
  'product/delete_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}`;
    const result = await axios.delete<IProduct>(requestUrl, {
      data: { ids }
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntities = createAsyncThunk(
  'product/archive_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/archive`;
    const result = await axios.patch<IProduct>(requestUrl, {
      ids
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const unArchiveEntities = createAsyncThunk(
  'product/un_archive_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/unarchive`;
    const result = await axios.patch<IProduct>(requestUrl, {
      ids
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const exportEntities = createAsyncThunk(
  'retail-item/export_entities',
  async (ids: Array<string>, thunkAPI) => {
    const requestUrl = `api/export-data/retail-variable`;

    // Make the request with responseType: 'blob' to receive binary data
    const response = await axios.post(requestUrl, ids, {
      responseType: 'blob' // Expect the response to be in binary format
    });

    // Create a Blob from the response data
    const blob = new Blob([response.data], { type: response.headers['content-type'] });

    // Create a temporary download link and trigger it
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'exported_file.xlsx'; // Replace this with the correct file extension, e.g., 'exported_file.xlsx' if it's an Excel file
    document.body.appendChild(link);
    link.click();
    link.remove(); // Clean up the DOM after the download

    // Optionally dispatch another action or return the result
    thunkAPI.dispatch(getEntities({}));
    return response.data;
  },
  { serializeError: serializeAxiosError }
);




// slice

export const ProductSlice = createEntitySlice({
  name: 'product',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(archiveEntity.fulfilled, state => {
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
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity, updateEntities, purgeEntities, archiveEntities, unArchiveEntities, exportEntities), (state, action) => {
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
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, archiveEntity, updateEntities, purgeEntities, archiveEntities, unArchiveEntities, exportEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = ProductSlice.actions;

// Reducer
export default ProductSlice.reducer;
