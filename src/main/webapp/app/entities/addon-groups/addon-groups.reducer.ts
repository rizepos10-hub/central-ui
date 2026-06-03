import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IAddonGroup, defaultValue } from 'app/shared/model/ADDON/addon-groups.model';

const initialState: EntityState<IAddonGroup> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/addon-groups';
const apiSearchUrl = 'api/_search/addon-groups';

// Actions

export const getEntities = createAsyncThunk('addon-groups/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IAddonGroup[]>(requestUrl);
});

export const searchEntities = createAsyncThunk('addon-groups/search_entity_list', async ({ query }: IQueryParams) => {
  return axios.post<IAddonGroup[]>(apiSearchUrl, query);
});

export const getEntity = createAsyncThunk(
  'addon-groups/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IAddonGroup>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'addon-groups/create_entity',
  async (entity: IAddonGroup, thunkAPI) => {
    const result = await axios.post<IAddonGroup>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'addon-groups/update_entity',
  async (entity: IAddonGroup, thunkAPI) => {
    const result = await axios.put<IAddonGroup>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'addon-groups/partial_update_entity',
  async (entity: IAddonGroup, thunkAPI) => {
    const result = await axios.patch<IAddonGroup>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'addon-groups/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IAddonGroup>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntity = createAsyncThunk(
  'addon-groups/archive_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}/archive`;
    const result = await axios.patch<IAddonGroup>(requestUrl);
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntities = createAsyncThunk(
  'addon-groups/archive_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/archive`;
    const result = await axios.patch<IAddonGroup>(requestUrl, {
      ids
    });
    thunkAPI.dispatch(searchEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const unArchiveEntities = createAsyncThunk(
  'addon-groups/unarchive_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/un-archive`;
    const result = await axios.patch<IAddonGroup>(requestUrl, {
      ids
    });
    thunkAPI.dispatch(searchEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const purgeEntities = createAsyncThunk(
  'addon-groups/purge_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}`;
    const result = await axios.delete<IAddonGroup>(requestUrl, {
      data: { ids }
    });
    thunkAPI.dispatch(searchEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateAddons = createAsyncThunk(
  'addon-groups/update_addons',
  async ({ id, addonGroupId, addons }: { id: string | number; addonGroupId: string; addons: any[] }, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}/addons`;
    const result = await axios.put<IAddonGroup>(requestUrl, { addonGroupId, addons });
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// TODO: Uncomment when backend export API is implemented
// export const exportEntities = createAsyncThunk(
//   'addon-groups/export_entities',
//   async (ids: Array<string>, thunkAPI) => {
//     const requestUrl = `api/export-data/addon-groups`;
//     
//     // Make the request and expect job information instead of blob
//     const response = await axios.post(requestUrl, ids);
//     
//     return response;
//   },
//   { serializeError: serializeAxiosError }
// );

// slice

export const AddonGroupsSlice = createEntitySlice({
  name: 'addon-groups',
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
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity, archiveEntities, unArchiveEntities, purgeEntities /* , exportEntities */), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isFulfilled(updateAddons), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities, archiveEntity, archiveEntities, unArchiveEntities, purgeEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity, archiveEntity, archiveEntities, unArchiveEntities, purgeEntities /* , exportEntities */), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      })
      .addMatcher(isPending(updateAddons), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = AddonGroupsSlice.actions;

// Reducer
export default AddonGroupsSlice.reducer;
