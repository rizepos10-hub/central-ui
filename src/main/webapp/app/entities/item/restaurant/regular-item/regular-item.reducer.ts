import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IRegularItem, defaultValue } from 'app/shared/model/ITEM/restaurant/regular-item.model';

const initialState: EntityState<IRegularItem> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/items/restaurant-variable';
const summaryUrl = 'api/items/restaurant-variable/summary';
const apiSearchUrl = 'api/_search/items/restaurant-variable';


// Actions

export const filterEntities = createAsyncThunk('regular-item/filter_entity_list', async ({ query, }: IQueryParams) => {
  return axios.post<IRegularItem[]>(apiSearchUrl, query);
});

export const getEntities = createAsyncThunk('regular-item/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IRegularItem[]>(requestUrl);
});



export const getEntity = createAsyncThunk(
  'regular-item/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IRegularItem>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'regular-item/create_entity',
  async (entity: IRegularItem, thunkAPI) => {
    const result = await axios.post<IRegularItem>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'regular-item/update_entity',
  async (entity: IRegularItem, thunkAPI) => {
    const result = await axios.put<IRegularItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntities = createAsyncThunk(
  'regular-item/update_entity',
  async (
    { entity, query }: { entity: IRegularItem[]; query: any },
    thunkAPI
  ) => {
    const result = await axios.put<IRegularItem[]>(`${apiUrl}`, entity);
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'regular-item/partial_update_entity',
  async (entity: IRegularItem, thunkAPI) => {
    const result = await axios.patch<IRegularItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntity = createAsyncThunk(
  'regular-item/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}/archive`;
    const result = await axios.patch<IRegularItem>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntities = createAsyncThunk(
  'regular-item/delete_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/archive`;
    const result = await axios.patch<IRegularItem>(requestUrl, {
      ids
    });
    console.log(query)
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
    const result = await axios.patch<IRegularItem>(requestUrl, {
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
    const result = await axios.delete<IRegularItem>(requestUrl, {
      data: { ids }
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const exportEntities = createAsyncThunk(
  'regular-item/export_entities',
  async (ids: Array<string>, thunkAPI) => {
    const requestUrl = `api/export-data/restaurant-variable`;

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

export const RegularItemSlice = createEntitySlice({
  name: 'regular-item',
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
      .addMatcher(isPending(getEntities, getEntity, archiveEntity, archiveEntities, unArchiveEntities, purgeEntities, filterEntities), state => {
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

export const { reset } = RegularItemSlice.actions;

// Reducer
export default RegularItemSlice.reducer;
