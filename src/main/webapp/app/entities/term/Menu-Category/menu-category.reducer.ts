import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ITerm, defaultValue } from 'app/shared/model/term.model';

const initialState: EntityState<ITerm> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/menu-categories';
const apiSearchUrl = 'api/_search/menu-categories';

// Actions

export const searchEntities = createAsyncThunk('menu-category/search_entity', async ({ query, page, size, sort, taxonomyName }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}${taxonomyName ? `&taxonomyName=${encodeURIComponent(taxonomyName)}` : ''}`;
  return axios.get<ITerm[]>(requestUrl);
});

export const getEntities = createAsyncThunk('menu-category/fetch_entity_list', async ({ page, size, sort, taxonomyName }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}?` : '?'}cacheBuster=${new Date().getTime()}`;
  return  axios.get<ITerm[]>(requestUrl);
});



export const getEntity = createAsyncThunk(
  'menu-category/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ITerm>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);


export const createEntity = createAsyncThunk(
  'menu-category/create_entity',
  async (entity: ITerm, thunkAPI) => {
    const result = await axios.post<ITerm>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);



export const updateEntity = createAsyncThunk(
  'menu-category/update_entity',
  async (entity: ITerm, thunkAPI) => {
    const result = await axios.put<ITerm>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'menu-category/partial_update_entity',
  async (entity: ITerm, thunkAPI) => {
    const result = await axios.patch<ITerm>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'menu-category/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ITerm>(requestUrl);
    // thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);





// slice

export const TermSlice = createEntitySlice({
  name: 'menu-category',
  initialState,
  reducers: {
    changeEntityField(state, action) {
      state.entity = {
        ...state.entity,
        [action.payload.name]: action.payload.value,
      };
    },
  },
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

export const { reset, changeEntityField } = TermSlice.actions;

// Reducer
export default TermSlice.reducer;
