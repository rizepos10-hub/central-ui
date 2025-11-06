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
import { IAddon, defaultValue } from 'app/shared/model/ADDON/addon.model';

const initialState: EntityState<IAddon> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/addons';
const apiSearchUrl = 'api/_search/addons';

// Actions

export const searchEntities = createAsyncThunk('addon/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IAddon[]>(requestUrl);
});

export const filterEntities = createAsyncThunk('addon/filter_entity_list', async ({ query }: IQueryParams) => {
  return axios.post<IAddon[]>(apiSearchUrl, query);
});


export const getEntities = createAsyncThunk('addon/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IAddon[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'addon/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IAddon>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'addon/create_entity',
  async (entity: IAddon, thunkAPI) => {
    const result = await axios.post<IAddon>(apiUrl, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'addon/update_entity',
  async (entity: IAddon, thunkAPI) => {
    const result = await axios.put<IAddon>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntity(entity.id));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'addon/partial_update_entity',
  async (entity: IAddon, thunkAPI) => {
    const result = await axios.patch<IAddon>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'addon/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IAddon>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntity = createAsyncThunk(
  'addon/archive_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}/archive`;
    const result = await axios.patch<IAddon>(requestUrl);
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntities = createAsyncThunk(
  'addon/archive_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/archive`;
    const result = await axios.patch<IAddon>(requestUrl, {
      ids
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const unArchiveEntities = createAsyncThunk(
  'addon/unarchive_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/unarchive`;
    const result = await axios.patch<IAddon>(requestUrl, {
      ids
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const purgeEntities = createAsyncThunk(
  'addon/purge_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}`;
    const result = await axios.delete<IAddon>(requestUrl, {
      data: { ids }
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const exportEntities = createAsyncThunk(
  'addon/export_entities',
  async (ids: Array<string>, thunkAPI) => {
    const requestUrl = `api/export-data/addons`; // fake URL as requested

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
    link.download = 'exported_addons.xlsx'; // Replace this with the correct file extension
    document.body.appendChild(link);
    link.click();
    link.remove(); // Clean up the DOM after the download

    // Optionally dispatch another action or return the result
    thunkAPI.dispatch(getEntities({}));
    return response.data;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<ChangeFieldPayload<IAddon>>('addon/change-entity-field');

// slice

export const AddonSlice = createEntitySlice({
  name: 'addon',
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
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity, archiveEntities, unArchiveEntities, purgeEntities, exportEntities), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities, filterEntities, archiveEntity, archiveEntities, unArchiveEntities, purgeEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity, archiveEntity, archiveEntities, unArchiveEntities, purgeEntities, exportEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = AddonSlice.actions;

// Reducer
export default AddonSlice.reducer;
