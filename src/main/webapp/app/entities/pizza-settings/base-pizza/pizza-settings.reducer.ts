import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IPizzaSettings, defaultValue } from 'app/shared/model/PIZZA/pizza-settings.model';

const initialState: EntityState<IPizzaSettings> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/settings/pizza';

// Actions

export const getEntity = createAsyncThunk('PizzaSettings/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IPizzaSettings>(requestUrl);
});

export const updateEntity = createAsyncThunk(
  'PizzaSettings/update_entity',
  async (entity: any, thunkAPI) => {
    const result = await axios.put<any>(`${apiUrl}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntity({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{
  name: string
  value: any
}>('online-ordering-settings/change-entity-field')
// slice

export const PizzaSettingsSlice = createEntitySlice({
  name: 'PizzaSettings',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload
        const path = name.split('.') // e.g. ['layouts', 'selectedLayout']
        let current: any = state.entity

        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) current[path[i]] = {}
          current = current[path[i]]
        }

        current[path[path.length - 1]] = value
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addMatcher(isFulfilled(updateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = PizzaSettingsSlice.actions;

// Reducer
export default PizzaSettingsSlice.reducer;
