import axios from 'axios';
import { createAsyncThunk, createSlice, isPending } from '@reduxjs/toolkit';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IEndOfDayConfig, EndOfDaySection } from 'app/shared/model/end-of-day-config.model';
import { IBranch } from 'app/shared/model/branch.model';

export interface IEndOfDayState {
  loading: boolean;
  errorMessage: string | null;
  config: IEndOfDayConfig | null;
  submitting: boolean;
  submitSuccess: boolean;
}

const initialState: IEndOfDayState = {
  loading: false,
  errorMessage: null,
  config: null,
  submitting: false,
  submitSuccess: false,
};

const apiUrl = 'api/end-of-day';

// Actions

export const getInitialConfiguration = createAsyncThunk(
  'endOfDay/fetch_initial_configuration',
  async (branchId: string) => {
    const requestUrl = `${apiUrl}/initial-configuration/${branchId}`;
    return axios.get<IEndOfDayConfig>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export interface ISubmitEndOfDayPayload {
  actionTakenBy: string;
  branch: IBranch;
  toDate: string;
  sections: EndOfDaySection[];
  actualCash?: number;
}

export const submitEndOfDay = createAsyncThunk(
  'endOfDay/submit_end_of_day',
  async (payload: ISubmitEndOfDayPayload) => {
    const result = await axios.post(apiUrl, payload);
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const EndOfDaySlice = createSlice({
  name: 'endOfDay',
  initialState,
  reducers: {
    reset() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getInitialConfiguration.fulfilled, (state, action: any) => {
        state.loading = false;
        state.config = action.payload.data;
      })
      .addCase(getInitialConfiguration.rejected, (state, action: any) => {
        state.loading = false;
        state.errorMessage = action.error.message;
      })
      .addCase(submitEndOfDay.fulfilled, (state) => {
        state.submitting = false;
        state.submitSuccess = true;
      })
      .addCase(submitEndOfDay.rejected, (state, action: any) => {
        state.submitting = false;
        state.submitSuccess = false;
        state.errorMessage = action.error.message;
      })
      .addMatcher(isPending(getInitialConfiguration), (state) => {
        state.errorMessage = null;
        state.loading = true;
        state.config = null;
      })
      .addMatcher(isPending(submitEndOfDay), (state) => {
        state.errorMessage = null;
        state.submitting = true;
        state.submitSuccess = false;
      });
  },
});

export const { reset } = EndOfDaySlice.actions;

// Reducer
export default EndOfDaySlice.reducer;
