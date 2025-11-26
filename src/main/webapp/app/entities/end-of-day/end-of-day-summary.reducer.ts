import axios from 'axios';
import { createAsyncThunk, createSlice, isPending } from '@reduxjs/toolkit';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { EndOfDaySection } from 'app/shared/model/end-of-day-config.model';

export interface IEndOfDaySummaryState {
  loading: boolean;
  errorMessage: string | null;
  summary: any | null;
}

const initialState: IEndOfDaySummaryState = {
  loading: false,
  errorMessage: null,
  summary: null,
};

const apiUrl = 'api/end-of-day';

// Actions

export interface IGetSummaryPayload {
  branchId: string;
  toDate: string | null;
  sections?: EndOfDaySection[];
}

export const getSummaryForBranch = createAsyncThunk(
  'endOfDaySummary/get_summary_for_branch',
  async (payload: IGetSummaryPayload) => {
    const { branchId, toDate, sections } = payload;
    let requestUrl = toDate
      ? `${apiUrl}/summary-for-branch/${branchId}?toDate=${toDate}`
      : `${apiUrl}/summary-for-branch/${branchId}`;
    if (sections && sections.length > 0) {
      const sectionsParam = sections.map(s => `sections=${s}`).join('&');
      requestUrl += `${toDate ? '&' : '?'}${sectionsParam}`;
    }
    return axios.get(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

// slice

export const EndOfDaySummarySlice = createSlice({
  name: 'endOfDaySummary',
  initialState,
  reducers: {
    reset() {
      return initialState;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(getSummaryForBranch.fulfilled, (state, action: any) => {
        state.loading = false;
        state.summary = action.payload.data;
      })
      .addCase(getSummaryForBranch.rejected, (state, action: any) => {
        state.loading = false;
        state.errorMessage = action.error?.message || 'Failed to load summary';
      })
      .addMatcher(isPending(getSummaryForBranch), (state) => {
        state.errorMessage = null;
        state.loading = true;
        state.summary = null;
      });
  },
});

export const { reset } = EndOfDaySummarySlice.actions;

// Reducer
export default EndOfDaySummarySlice.reducer;
