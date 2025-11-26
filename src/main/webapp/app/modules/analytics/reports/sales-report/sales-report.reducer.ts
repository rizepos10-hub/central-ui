// salesReportSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ISalesReport } from 'app/shared/model/sales-report.model';
import axios from 'axios';
import { serializeAxiosError } from 'app/shared/reducers/reducer.utils';

const apiUrl = 'api/report/sales';

export interface SalesReportState {
  data: ISalesReport | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalesReportState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchSalesReportRedux = createAsyncThunk(
  'sales_report/fetch_sales_report',
  async ({ dateRange, measure, type, branchId }: { dateRange: any; measure: string; type: string; branchId?: string | null }) => {
    try {
      const { from, to, dateSlot } = dateRange;

      const requestData = {
        dateRange: {
          from,
          to,
          dateSlot,
        },
        measure,
        type,
        branchId: branchId || null,
      };

      const response = await axios.post<ISalesReport>(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  },
  { serializeError: serializeAxiosError }
);

const salesReportSlice = createSlice({
  name: 'salesReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesReportRedux.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesReportRedux.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSalesReportRedux.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'An error occurred';
      });
  },
});

export const selectSalesReport = (state: { salesReport: SalesReportState }) => state.salesReport;

export default salesReportSlice.reducer;
