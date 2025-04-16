import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IComboItem, defaultValue } from 'app/shared/model/ITEM/restaurant/combo-item.model';

const initialState: EntityState<IComboItem> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/items/restaurant-combo';
const apiSearchUrl = 'api/_search/items/restaurant-combo';

// Actions

export const filterEntities = createAsyncThunk('combo-item/filter_entity_list', async ({ query, }: IQueryParams) => {
  return axios.post<IComboItem[]>(apiSearchUrl, query);
});

export const getEntities = createAsyncThunk('combo-item/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IComboItem[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'combo-item/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IComboItem>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'combo-item/create_entity',
  async (entity: IComboItem, thunkAPI) => {
    const result = await axios.post<IComboItem>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'combo-item/update_entity',
  async (entity: IComboItem, thunkAPI) => {
    const result = await axios.put<IComboItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntities = createAsyncThunk(
  'combo-item/update_entity',
  async (
    { entity, query }: { entity: IComboItem[]; query: any },
    thunkAPI
  ) => {
    const result = await axios.put<IComboItem[]>(`${apiUrl}`, entity);
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'combo-item/partial_update_entity',
  async (entity: IComboItem, thunkAPI) => {
    const result = await axios.patch<IComboItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntity = createAsyncThunk(
  'combo-item/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}/archive`;
    const result = await axios.patch<IComboItem>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntities = createAsyncThunk(
  'combo-item/delete_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/archive`;
    const result = await axios.patch<IComboItem>(requestUrl, {
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
    const result = await axios.patch<IComboItem>(requestUrl, {
      ids
    });
    thunkAPI.dispatch(filterEntities({ query }));
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
    const result = await axios.delete<IComboItem>(requestUrl, {
      data: { ids }
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);


export const exportEntities = createAsyncThunk(
  'combo-item/export_entities',
  async (ids: Array<string>, thunkAPI) => {
    const requestUrl = `api/export-data/restaurant-combo`;

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

export const ComboItemSlice = createEntitySlice({
  name: 'combo-item',
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
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity, updateEntities, archiveEntities, unArchiveEntities, purgeEntities, exportEntities), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, filterEntities, unArchiveEntities, purgeEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, archiveEntity, updateEntities, archiveEntities, unArchiveEntities, purgeEntities, exportEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = ComboItemSlice.actions;

// Reducer
export default ComboItemSlice.reducer;
