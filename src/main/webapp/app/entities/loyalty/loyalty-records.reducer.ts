import { createEntitySlice, EntityState, IQueryParams } from 'app/shared/reducers/reducer.utils';
import { createAsyncThunk, createSlice, isFulfilled, isPending } from '@reduxjs/toolkit';
import axios from 'axios';
import { ICustomer } from 'app/shared/model/customer.model';

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
  entity: {} as LoyaltyRecord,
  totalItems: 0,
  updating: false,
  updateSuccess: false,
};

export const getLoyaltyRecords = createAsyncThunk('loyaltyRecords/fetch_allRecords', async (queryParams: any) => {
  return axios.post<LoyaltyRecord[]>('api/customer-points', queryParams );
});

export const getLoyaltyRecordById = createAsyncThunk('loyaltyRecords/fetch_recordById', async (id: string)=>{
  return axios.get<LoyaltyRecord>(`${apiUrl}/${id}`);
})


const loyaltyRecordsSlice = createEntitySlice({
  name: 'loyaltyRecords',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addMatcher(isPending(getLoyaltyRecords, getLoyaltyRecordById), state => {
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
      })
      .addMatcher(isFulfilled(getLoyaltyRecordById), (state, action)=>{
        const {data, headers} = action.payload;
        return {
          ...state,
          loading: false,
          entity: data,
        }
      });
  },
});

export default loyaltyRecordsSlice.reducer;
