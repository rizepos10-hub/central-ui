import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ICurrencySettings, defaultValue } from 'app/shared/model/CURRENCY/currency-settings.model';

const initialState: EntityState<ICurrencySettings> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/settings/currencies';

// Actions


export const getEntity = createAsyncThunk(
  'currency-settings/fetch_entity',
  async () => {
    const requestUrl = `${apiUrl}`;
    return axios.get<ICurrencySettings>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);



export const updateEntity = createAsyncThunk(
  'currency-settings/update_entity',
  async (entity: ICurrencySettings, thunkAPI) => {
    const result = await axios.put<ICurrencySettings>(`${apiUrl}`, cleanEntity(entity));
    return result;
  },
  { serializeError: serializeAxiosError }
);



// slice

export const CurrencySettingsSlice = createEntitySlice({
  name: 'currency-settings',
  initialState,
  extraReducers(builder) {
    builder
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

export const { reset } = CurrencySettingsSlice.actions;

// Reducer
export default CurrencySettingsSlice.reducer;
