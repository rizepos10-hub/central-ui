import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IBill, defaultValue } from 'app/shared/model/ORDER/bill.model';

const initialState: EntityState<IBill> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};
const apiUrl = 'api/bills';

// Actions


export const getEntity = createAsyncThunk(
  'bill/fetch_entity',
  async ({ orderId, billId }: { orderId: string | number; billId: string | number }) => {
    const requestUrl = `api/orders/${orderId}/${billId}`;
    return axios.get<IBill>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: string; value: any }>('bill/change-entity-field');

// slice

export const BillSlice = createEntitySlice({
  name: 'bill',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value;
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
  },
});

export const { reset } = BillSlice.actions;

// Reducer
export default BillSlice.reducer;
