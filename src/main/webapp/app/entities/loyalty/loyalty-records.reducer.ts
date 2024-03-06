import { createEntitySlice, EntityState, IQueryParams } from 'app/shared/reducers/reducer.utils';
import { createAsyncThunk, createSlice, isFulfilled, isPending } from '@reduxjs/toolkit';
import axios from 'axios';
import { defaultValue, ILoyalty } from 'app/shared/model/CUSTOMER/loyalty.model';

const apiUrl = 'api/customer-points';
const updateUrl = 'api/loyalty-point';

const initialState: EntityState<ILoyalty> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  totalItems: 0,
  updating: false,
  updateSuccess: false,
};

export const getEntities = createAsyncThunk('loyaltyRecords/fetch_allRecords', async (queryParams: any) => {
  return axios.post<ILoyalty[]>(apiUrl, queryParams );
});

export const getEntity = createAsyncThunk('loyaltyRecords/fetch_recordById', async (id: string)=>{
  return axios.get<ILoyalty>(`${apiUrl}/${id}`);
})

export const updateEntities = createAsyncThunk('loyaltyRecords/update_record', async (queryParams: any)=> {
  const { id } = queryParams;
  return axios.put(`${updateUrl}/${id}`, queryParams);
})

const loyaltyRecordsSlice = createEntitySlice({
  name: 'loyaltyRecords',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addMatcher(isPending(getEntities, getEntity), state => {
        state.errorMessage = null;
        state.loading = true;
        state.updateSuccess = false;
      })
      .addMatcher(isFulfilled(getEntities), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
          updateSuccess: false
        };
      })
      .addMatcher(isFulfilled(getEntity), (state, action)=>{
        const {data, headers} = action.payload;
        return {
          ...state,
          loading: false,
          entity: data,
          updateSuccess: false
        }
      }).addMatcher(isPending(updateEntities), (state)=> {
        state.updating = true;
        state.updateSuccess = false;
        state.errorMessage = null;
    }).addMatcher(isFulfilled(updateEntities), (state, action)=>{
      state.updateSuccess = true;
      state.updating = false;
    });
  },
});

export default loyaltyRecordsSlice.reducer;
