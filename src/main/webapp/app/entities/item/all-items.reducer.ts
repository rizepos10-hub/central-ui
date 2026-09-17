import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IItem, defaultValue } from 'app/shared/model/ITEM/item.model';
import { isRequestCancellation } from 'app/config/request-utils';

const initialState: EntityState<IItem> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/items';

// Actions

export const searchEntities = createAsyncThunk('items/search_entity', async ({ query, page, size, sort }: IQueryParams, thunkAPI) => {
  const requestUrl = `api/_search/items/by-name?query=${query}&page=${page}&size=${size}`;

  return axios.get<IItem[]>(requestUrl, {
    signal: thunkAPI.signal
  });
});

export const getEntities = createAsyncThunk('items/fetch_entity_list', async ({ page, size, sort, name, categoryId, unassignedItems }: IQueryParams, thunkAPI) => {
  const params = new URLSearchParams();

  if (page !== undefined) {
    params.append('page', String(page));
  }
  if (size !== undefined) {
    params.append('size', String(size));
  }
  if (sort) {
    params.append('sort', sort);
  }
  if (name !== undefined) {
    params.append('query', name ?? '');
  }
  if (categoryId !== undefined) {
    params.append('categoryId', String(categoryId));
  }
  if (unassignedItems !== undefined) {
    params.append('unassignedItems', String(unassignedItems));
  }

  params.append('cacheBuster', String(new Date().getTime()));

  const requestUrl = `${apiUrl}?${params.toString()}`;
  const response = await axios.get<IItem[]>(requestUrl, {
    signal: thunkAPI.signal
  });
  return response;
});

// slice

export const ItemsSlice = createEntitySlice({
  name: 'items',
  initialState,
  skipRejectionHandling: true, // Skip default rejection handling to prevent AbortError from setting loading: false
  extraReducers(builder) {
    builder
      .addMatcher(isFulfilled(getEntities, searchEntities), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isPending(getEntities, searchEntities), (state, action) => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isRejected(getEntities, searchEntities), (state, action) => {
        // Only update state if this isn't an aborted request
        if (!isRequestCancellation(action.error)) {
          state.loading = false;
          state.updating = false;
          state.updateSuccess = false;
          state.errorMessage = action.error.message;
        }
      });
  },
});

export const { reset } = ItemsSlice.actions;

// Reducer
export default ItemsSlice.reducer;
