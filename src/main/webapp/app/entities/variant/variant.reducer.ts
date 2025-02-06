import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { IQueryParams, createEntitySlice, EntityState } from 'app/shared/reducers/reducer.utils';

import { defaultValue, IVariableItemVariant } from "app/shared/model/ITEM/retail/variable-item.model";

const initialState: EntityState<IVariableItemVariant> = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: defaultValue,
    updating: false,
    totalItems: 0,
    updateSuccess: false,
};

const apiUrl = 'api/_search/variants';

// Actions
export const getEntitiess = createAsyncThunk('variant/fetch_entity_list', async ({ query }: IQueryParams) => {
    const requestUrl = `${apiUrl}${query ? `/by-name?query=${query}&` : '?'}cacheBuster=${new Date().getTime()}`;
    return axios.get<IVariableItemVariant[]>(requestUrl);
});

export const VariantSlice = createEntitySlice({
    name: 'variant',
    initialState,
    extraReducers(builder) {
        builder
    }
});

export const { reset } = VariantSlice.actions;

// Reducer
export default VariantSlice.reducer;
