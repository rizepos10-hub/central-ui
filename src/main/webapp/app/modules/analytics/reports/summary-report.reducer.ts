
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ISummaryReport } from "app/shared/model/report-summary.model";


export interface SummaryReportState {
  report: ISummaryReport | null;
  reportByTill: ISummaryReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: SummaryReportState = {
  report: null,
  reportByTill: null,
  loading: false,
  error: null,
};

const apiUrl = 'api/report/sales-summary';


export const getSummaryReportByTill = createAsyncThunk(
  'summaryReport/fetch_summary_report',
  async ({ tillId }: { tillId: string }) => {
      const modifiedUrl = `${apiUrl}&tillId=${tillId}`;

      return await axios.post<ISummaryReport>(modifiedUrl);
  },
{ serializeError: serializeAxiosError}
);

const SummaryReportSlice = createSlice({
  name: 'salesReport',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(getSummaryReportByTill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSummaryReportByTill.fulfilled, (state, action) => {
        state.loading = false;
        state.reportByTill = action.payload.data;
      })
      .addCase(getSummaryReportByTill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'An error occurred';
      });
  },
});


export default SummaryReportSlice.reducer;
