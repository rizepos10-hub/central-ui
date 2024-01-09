import {defaultValue, ICustomer} from "app/shared/model/customer.model";
import {createAsyncThunk, isFulfilled, isPending} from "@reduxjs/toolkit";
import axios from "axios";
import {createEntitySlice} from "app/shared/reducers/reducer.utils";

const searchUrl = 'api/_search/customers';

const initialState = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  totalItems: 0,
  updating: false,
  updateSuccess: false,
}
export const searchCustomers = createAsyncThunk('loyaltyRecords/fetch_loyalty_customers', async (queryParams: any) => {
  return axios.post<ICustomer[]>(searchUrl, queryParams );
});

const loyaltyCustomersSlice = createEntitySlice({
  name: 'loyaltyRecords/allCustomers',
  initialState,
  reducers:{},
  extraReducers(builder){
    builder
      .addMatcher(isPending(searchCustomers), state =>{
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isFulfilled(searchCustomers), (state, action) =>{
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
  }
});

export default loyaltyCustomersSlice.reducer;
