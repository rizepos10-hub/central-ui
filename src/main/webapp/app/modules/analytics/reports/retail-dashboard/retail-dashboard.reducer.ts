import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IRetailDashboard, defaultValue } from 'app/shared/model/retail-dashboard.model';

const initialState: EntityState<IRetailDashboard> = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: defaultValue,
    updating: false,
    totalItems: 0,
    updateSuccess: false,
};

const apiUrl = 'api/report/retail';

// Actions
export const getReportData = createAsyncThunk(
    'retail/get_report_data',
    async ({ entity, reportType }: { entity: IRetailDashboard; reportType: string }, thunkAPI) => {
        const url = `${apiUrl}/${reportType}`;
        const result = await axios.post(url, cleanEntity(entity));
        return result.data;
    },
    { serializeError: serializeAxiosError }
);

// slice

export const RetailDashboardSlice = createEntitySlice({
    name: 'retail-dashboard',
    initialState,
    extraReducers(builder) {
        builder
            .addCase(getReportData.fulfilled, (state, action) => {
                state.loading = false;
                state.entity = action.payload.data;
            })
            .addMatcher(isFulfilled(getReportData), (state, action) => {
                const { data, headers } = action.payload;

                return {
                    ...state,
                    loading: false,
                    entities: data,
                    totalItems: parseInt(headers['x-total-count'], 10),
                };
            })
            .addMatcher(isFulfilled(getReportData), (state, action) => {
                state.updating = false;
                state.loading = false;
                state.updateSuccess = true;
                state.entity = action.payload.data;
            })
    },
});

export const { reset } = RetailDashboardSlice.actions;

// Reducer
export default RetailDashboardSlice.reducer;
