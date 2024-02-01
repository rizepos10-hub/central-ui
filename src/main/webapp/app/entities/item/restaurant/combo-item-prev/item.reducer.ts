import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IItem, defaultValue } from 'app/shared/model/ITEM/item.model';

const initialState: EntityState<IItem> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/items/restaurant-combo';
const summaryUrl = 'api/items/restaurant-combo/summary';

const apiSearchUrl = 'api/_search/items/restaurant-combo';

// Actions

export const searchEntities = createAsyncThunk('item/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `api/_search/items/restaurant-combo/by-name?query=${query}&page=${page}&size=${size}`;

  // Perform the API call
  return axios.get<IItem[]>(requestUrl);
});

export const getItemsForRecipe = createAsyncThunk(
  'item/fetch_items_for_recipe_list',
  async ({ itemId, editingVariant }: { itemId?: string; editingVariant?: string }) => {
    const requestUrl = `/items/restaurant-variable/for-recipe?${itemId ? `itemId=${itemId}` : ''}${editingVariant ? `&variantId=${editingVariant}` : ''}`;
    const response = await axios.get<IItem[]>(requestUrl);
    console.log(response, 'response');
    return response;
  }
);

export const importData = createAsyncThunk('importData', async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'ITEM');

    const response = await axios.post('/api/import-data', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  } catch (error) {
    console.error('Error during data import:', error.response ? error.response.data.message : error.message);

    return error;
  }
});

export const getEntities = createAsyncThunk('combo_item/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  const response = await axios.get<IItem[]>(requestUrl);
  console.log(response, 'responsin');
  return response;
});

export const getItemsSummary = createAsyncThunk('combo_item/fetch_item_summary_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${summaryUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  const response = await axios.get<IItem[]>(requestUrl);
  console.log(response, 'responsin');
  return response;
});

// export const importAddons = createAsyncThunk<IItem, { entity: IItem; fromItem: string }, { rejectValue: any }>(
//   'item/import_addons',
//   async ({entity, fromItem}, thunkAPI) => {
//     const result = await axios.put<IItem>(`${apiUrl}/${entity.id}/copy-addons?fromItem=${fromItem}`,
//       cleanEntity(entity));
//     thunkAPI.dispatch(getEntities({}));
//     return result;
//   },
//   { serializeError: serializeAxiosError }
// );
export const importAddons = createAsyncThunk<IItem, {  fromItem: string }, { rejectValue: any }>(
  'item/import_addons',
  async ({  fromItem }, thunkAPI) => {
    try {
      const response = await axios.get<IItem>(`${apiUrl}/${fromItem}`);
      thunkAPI.dispatch(getEntities({}));

      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error.message; // Rethrow the error to be handled by Redux Toolkit
    }
  },
  { serializeError: serializeAxiosError }
);

export const getEntity = createAsyncThunk(
  'combo_item/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IItem>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'combo_item/create_entity',
  async (entity: IItem, thunkAPI) => {
    const result = await axios.post<IItem>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'combo_item/update_entity',
  async (entity: IItem, thunkAPI) => {
    const result = await axios.put<IItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'combo_item/partial_update_entity',
  async (entity: IItem, thunkAPI) => {
    const result = await axios.patch<IItem>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'combo_item/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IItem>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
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
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addMatcher(isFulfilled(getEntities, searchEntities, getItemsForRecipe, getItemsSummary), (state, action) => {
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
      .addMatcher(isPending(getEntities, getEntity, searchEntities, getItemsForRecipe, getItemsSummary), state => {
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

export const { reset } = ComboItemSlice.actions;

// Reducer
export default ComboItemSlice.reducer;
