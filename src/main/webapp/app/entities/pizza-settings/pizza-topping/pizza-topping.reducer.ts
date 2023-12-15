import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ITopping, defaultValue } from 'app/shared/model/topping.model';
import {ITerm} from "app/shared/model/term.model";

const initialState  = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
  toppingGroups: []
};

const apiUrl = 'api/pizza/toppings';

// Actions

export const getEntities = createAsyncThunk('topping/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ITopping[]>(requestUrl);
});

export const getToppingGroups = createAsyncThunk('term/fetch_topping_groups', async ({ page, size, sort, taxonomyName }: IQueryParams) => {
  const requestUrl = `api/terms/search?taxonomy=Topping%20Groups&${sort ? `?page=${page}&size=${size}&sort=${sort}?` : '?'}cacheBuster=${new Date().getTime()}`;
  const  response = await axios.get<ITerm[]>(requestUrl)
  console.log(response, 'ress')
  return response
});
export const createToppingGroup = createAsyncThunk(
  'term/create_entity',
  async (entity: ITerm, thunkAPI) => {
    const result = await axios.post<ITerm>("/api/terms", cleanEntity(entity));
    thunkAPI.dispatch(getToppingGroups({page: 1, size: 300, sort: 'id,asc'}));
    return result;
  },
  { serializeError: serializeAxiosError }
);



export const getEntity = createAsyncThunk(
  'topping/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ITopping>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'topping/create_entity',
  async (entity: ITopping, thunkAPI) => {
    const result = await axios.post<ITopping>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'topping/update_entity',
  async (entity: ITopping, thunkAPI) => {
    const result = await axios.put<ITopping>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'topping/partial_update_entity',
  async (entity: ITopping, thunkAPI) => {
    const result = await axios.patch<ITopping>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'topping/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ITopping>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const ToppingSlice = createEntitySlice({
  name: 'topping',
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
      .addMatcher(isFulfilled(getEntities), (state, action) => {
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
      .addMatcher(isFulfilled(createToppingGroup), (state, action) => {
        state.updating = false;
        state.loading = false;
      })
      .addMatcher(isFulfilled(getToppingGroups), (state:any, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          toppingGroups: data,
        };
      })
      .addMatcher(isPending(getEntities, getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity,createToppingGroup), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = ToppingSlice.actions;

// Reducer
export default ToppingSlice.reducer;
