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

const initialState: EntityState<LoyaltyRecord> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  totalItems: 0,
  updating: false,
  updateSuccess: false,
};

export const getLoyaltyRecords = createAsyncThunk('loyaltyRecords/fetch_loyalty_records', async (queryParams: any) => {
  return axios.post<LoyaltyRecord[]>('api/customer-points', queryParams );
});


const loyaltyRecordsSlice = createEntitySlice({
  name: 'loyaltyRecords',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addMatcher(isPending(getLoyaltyRecords), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isFulfilled(getLoyaltyRecords), (state, action) => {
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
