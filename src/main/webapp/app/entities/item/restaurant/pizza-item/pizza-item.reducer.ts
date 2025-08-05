import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IPizzaItem, defaultValue } from 'app/shared/model/ITEM/restaurant/pizza-item.model';
import { IComboItem } from "app/shared/model/ITEM/restaurant/combo-item.model";

const initialState: EntityState<IPizzaItem> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/items/restaurant-pizza';
const apiSearchUrl = 'api/_search/items/restaurant-pizza';

// Actions

export const filterEntities = createAsyncThunk('pizza-item/filter_entity_list', async ({ query, }: IQueryParams) => {
  return axios.post<IComboItem[]>(apiSearchUrl, query);
});

export const getEntities = createAsyncThunk('pizza-item/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IPizzaItem[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'pizza-item/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IPizzaItem>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'pizza-item/create_entity',
  async (entity: IPizzaItem, thunkAPI) => {
    const result = await axios.post<IPizzaItem>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'pizza-item/update_entity',
  async (entity: IPizzaItem, thunkAPI) => {
    const result = await axios.put<IPizzaItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntities = createAsyncThunk(
  'pizza-item/update_entity',
  async (
    { entity, query }: { entity: IPizzaItem[]; query: any },
    thunkAPI
  ) => {
    const result = await axios.put<IPizzaItem[]>(`${apiUrl}`, entity);
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'pizza-item/partial_update_entity',
  async (entity: IPizzaItem, thunkAPI) => {
    const result = await axios.patch<IPizzaItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntity = createAsyncThunk(
  'pizza-item/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}/archive`;
    const result = await axios.patch<IPizzaItem>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const archiveEntities = createAsyncThunk(
  'pizza-item/delete_entities',
  async (
    { ids, query }: { ids: Array<string | number>; query: any },
    thunkAPI
  ) => {
    const requestUrl = `${apiUrl}/archive`;
    const result = await axios.patch<IPizzaItem>(requestUrl, {
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
    const result = await axios.patch<IPizzaItem>(requestUrl, {
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
    const result = await axios.delete<IPizzaItem>(requestUrl, {
      data: { ids }
    });
    thunkAPI.dispatch(filterEntities({ query }));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const exportEntities = createAsyncThunk(
  'pizza-item/export_entities',
  async (ids: Array<string>, thunkAPI) => {
    const requestUrl = `api/export-data/restaurant-pizza`;
    
    // Make the request and expect job information instead of blob
    const response = await axios.post(requestUrl, ids);
    
    return response;
  },
  { serializeError: serializeAxiosError }
);


// slice

export const PizzaItemSlice = createEntitySlice({
  name: 'pizza-item',
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

export const { reset } = PizzaItemSlice.actions;

// Reducer
export default PizzaItemSlice.reducer;
