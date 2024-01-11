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
  entity: {},
  totalItems: 0,
  updating: false,
  updateSuccess: false,
};

export const getLoyaltyRecords = createAsyncThunk('loyaltyRecords/fetch_allRecords', async (queryParams: any) => {
  return axios.post<LoyaltyRecord[]>('api/customer-points', queryParams );
});

export const getLoyaltyRecordById = createAsyncThunk('loyaltyRecords/fetch_recordById', async (id: string)=>{
  return axios.get<LoyaltyRecord>(`api/customer-points/${id}`);
})

export const updateLoyaltyRecord = createAsyncThunk('loyaltyRecords/update_record', async (queryParams: any)=> {
  const { id, points } = queryParams;
  console.log(`ID: ${id}, POINTS:${points}`);
  return axios.put(`/api/loyalty-point/${id}`, {id, points});
})


const loyaltyRecordsSlice = createEntitySlice({
  name: 'loyaltyRecords',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addMatcher(isPending(getLoyaltyRecords, getLoyaltyRecordById), state => {
        state.errorMessage = null;
        state.loading = true;
        state.updateSuccess = false;
      })
      .addMatcher(isFulfilled(getLoyaltyRecords), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
          updateSuccess: false
        };
      })
      .addMatcher(isFulfilled(getLoyaltyRecordById), (state, action)=>{
        const {data, headers} = action.payload;
        return {
          ...state,
          loading: false,
          entity: data,
          updateSuccess: false
        }
      }).addMatcher(isPending(updateLoyaltyRecord), (state)=> {
        state.updating = true;
        state.updateSuccess = false;
        state.errorMessage = null;
    }).addMatcher(isFulfilled(updateLoyaltyRecord), (state, action)=>{
      state.updateSuccess = true;
      state.updating = false;
    });
  },
});

export default loyaltyRecordsSlice.reducer;
