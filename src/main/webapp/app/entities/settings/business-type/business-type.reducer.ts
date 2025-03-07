import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { BusinessType, defaultValue } from 'app/shared/model/business-type';

const initialState: EntityState<BusinessType> = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: defaultValue,
    updating: false,
    totalItems: 0,
    updateSuccess: false,
};

const apiUrl = 'api/business/types';

export const getEntities = createAsyncThunk('business-types/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
    const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
    return axios.get<BusinessType[]>(requestUrl);
});

// slice
export const BusinessTypeSlice = createEntitySlice({
    name: 'business type',
    initialState,
    extraReducers(builder) {
        builder
            .addMatcher(isFulfilled(getEntities), (state, action) => {
                const { data, headers } = action.payload;

                return {
                    ...state,
                    loading: false,
                    entities: data,
                    totalItems: parseInt(headers['x-total-count'], 10),
                };
            })
            .addMatcher(isPending(getEntities), state => {
                state.errorMessage = null;
                state.updateSuccess = false;
                state.loading = true;
            })
    },
});

export const { reset } = BusinessTypeSlice.actions;

// Reducer
export default BusinessTypeSlice.reducer;
