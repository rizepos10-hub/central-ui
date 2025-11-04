import axios from 'axios';
import { createAsyncThunk, createSlice, isPending, isFulfilled, isRejected } from '@reduxjs/toolkit';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';

export interface BusinessTimeZoneState {
  loading: boolean;
  errorMessage: string | null;
  timeZone: string | null;
  updating: boolean;
  updateSuccess: boolean;
}

const initialState: BusinessTimeZoneState = {
  loading: false,
  errorMessage: null,
  timeZone: null,
  updating: false,
  updateSuccess: false,
};

const apiUrl = '/api/business/time-zone';

// Actions

export const getBusinessTimeZone = createAsyncThunk(
  'businessTimeZone/fetch_timezone',
  async () => {
    const requestUrl = apiUrl;
    return axios.get<string>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const updateBusinessTimeZone = createAsyncThunk(
  'businessTimeZone/update_timezone',
  async (timeZone: string, thunkAPI) => {
    const requestUrl = `${apiUrl}?timeZone=${encodeURIComponent(timeZone)}`;
    const result = await axios.put<string>(requestUrl);
    thunkAPI.dispatch(getBusinessTimeZone());
    return result;
  },
  { serializeError: serializeAxiosError }
);

// Slice

export const BusinessTimeZoneSlice = createSlice({
  name: 'businessTimeZone',
  initialState,
  reducers: {
    reset() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getBusinessTimeZone.fulfilled, (state, action) => {
        state.loading = false;
        state.timeZone = action.payload.data;
      })
      .addCase(updateBusinessTimeZone.fulfilled, (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.timeZone = action.payload.data;
      })
      .addMatcher(isPending(getBusinessTimeZone), (state) => {
        state.errorMessage = null;
        state.loading = true;
      })
      .addMatcher(isPending(updateBusinessTimeZone), (state) => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      })
      .addMatcher(isRejected(getBusinessTimeZone, updateBusinessTimeZone), (state, action) => {
        state.loading = false;
        state.updating = false;
        state.updateSuccess = false;
        state.errorMessage = action.error.message;
      });
  },
});

export const { reset } = BusinessTimeZoneSlice.actions;

// Reducer
export default BusinessTimeZoneSlice.reducer;
