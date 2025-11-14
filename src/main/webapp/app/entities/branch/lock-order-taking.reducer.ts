import axios from 'axios';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';

export interface ILockOrderTakingState {
  locked: boolean;
  loading: boolean;
  updating: boolean;
  errorMessage: string | null;
}

const initialState: ILockOrderTakingState = {
  locked: false,
  loading: false,
  updating: false,
  errorMessage: null,
};

const apiUrl = 'api/branches';

// Actions

export const getLockOrderTakingStatus = createAsyncThunk(
  'lockOrderTaking/get_status',
  async (branchId: string) => {
    const requestUrl = `${apiUrl}/${branchId}/lock-order-taking`;
    return axios.get<{ locked: boolean }>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const updateLockOrderTaking = createAsyncThunk(
  'lockOrderTaking/update',
  async ({ branchId, lock, date }: { branchId: string; lock: boolean; date: string }) => {
    const requestUrl = `${apiUrl}/${branchId}/lock-order-taking?lock=${lock}&date=${date}`;
    return axios.put<{ locked: boolean }>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

// Slice

export const LockOrderTakingSlice = createSlice({
  name: 'lockOrderTaking',
  initialState,
  reducers: {
    reset() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getLockOrderTakingStatus.pending, state => {
        state.loading = true;
        state.errorMessage = null;
      })
      .addCase(getLockOrderTakingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.locked = action.payload.data.locked;
      })
      .addCase(getLockOrderTakingStatus.rejected, (state, action) => {
        state.loading = false;
        state.errorMessage = action.error.message || 'Failed to fetch lock status';
      })
      .addCase(updateLockOrderTaking.pending, state => {
        state.updating = true;
        state.errorMessage = null;
      })
      .addCase(updateLockOrderTaking.fulfilled, (state, action) => {
        state.updating = false;
        state.locked = action.payload.data.locked;
      })
      .addCase(updateLockOrderTaking.rejected, (state, action) => {
        state.updating = false;
        state.errorMessage = action.error.message || 'Failed to update lock status';
      });
  },
});

export const { reset } = LockOrderTakingSlice.actions;

// Reducer
export default LockOrderTakingSlice.reducer;
