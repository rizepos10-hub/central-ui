import { createEntitySlice, EntityState, IQueryParams } from 'app/shared/reducers/reducer.utils';
import { createAsyncThunk, createSlice, isFulfilled, isPending } from '@reduxjs/toolkit';
import axios from 'axios';
import { defaultValue, ICustomer } from 'app/shared/model/customer.model';

interface LoyaltyRecord {
  id: string;
  customer: ICustomer;
  isArchived: boolean;
  points: number;
}

const apiUrl = 'api/customer-points';
const apiSearchUrl = '';

const initialState: EntityState<LoyaltyRecord> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  totalItems: 0,
  updating: false,
  updateSuccess: false,
};

export const searchLoyaltyRecords = createAsyncThunk('loyaltyRecords/search_records', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<LoyaltyRecord[]>(requestUrl);
});

export const getLoyaltyRecords = createAsyncThunk('loyaltyRecords/fetch_loyalty_records', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<LoyaltyRecord[]>(requestUrl);
});

const loyaltyRecordsSlice = createEntitySlice({
  name: 'loyaltyRecords',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getLoyaltyRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.entities = action.payload.data;
      })
      .addMatcher(isPending(getLoyaltyRecords, searchLoyaltyRecords), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isFulfilled(getLoyaltyRecords, searchLoyaltyRecords), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      });
  },
});

export default loyaltyRecordsSlice.reducer;
