import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ILoyaltyExChange, defaultValue } from 'app/shared/model/CUSTOMER/loyalty.model';

const initialState: EntityState<ILoyaltyExChange> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/settings/loyalty-exchange';
const apiSearchUrl = 'api/_search/settings/loyalty-exchange';

// Actions





export const getEntity = createAsyncThunk(
  'loyalty-exchange/fetch_entity',
  async () => {
    const requestUrl = `${apiUrl}`;
    return axios.get<ILoyaltyExChange>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'loyalty-exchange/create_entity',
  async (entity: ILoyaltyExChange, thunkAPI) => {
    const result = await axios.post<ILoyaltyExChange>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntity());
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'loyalty-exchange/update_entity',
  async (entity: ILoyaltyExChange, thunkAPI) => {
    const result = await axios.put<ILoyaltyExChange>(`${apiUrl}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntity());
    return result;
  },
  { serializeError: serializeAxiosError }
);





// slice

export const LoyaltyExchangeSlice = createEntitySlice({
  name: 'loyalty-exchange',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addMatcher(isFulfilled(createEntity, updateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending( getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = LoyaltyExchangeSlice.actions;

// Reducer
export default LoyaltyExchangeSlice.reducer;
