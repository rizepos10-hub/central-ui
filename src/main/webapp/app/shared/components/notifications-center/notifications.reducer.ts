import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { INotification, defaultValue } from 'app/shared/model/notification.model';

const initialState: EntityState<INotification> = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: defaultValue,
    updating: false,
    totalItems: 0,
    updateSuccess: false,
};
const apiUrl = 'api/notifications/in-app';

// Actions

export const getEntities = createAsyncThunk('notification/fetch_entity_list', async ({ page, size, sort, query }: IQueryParams) => {
    const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
    return axios.get<INotification[]>(requestUrl);
});

export const changeEntityField = createAction<{ name: string; value: any }>('notification/change-entity-field');

// slice

export const NotificationSlice = createEntitySlice({
    name: 'notification',
    initialState,
    extraReducers(builder) {
        builder
            .addCase(changeEntityField, (state, action) => {
                const { name, value } = action.payload;
                state.entity[name] = value;
            })
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

export const { reset } = NotificationSlice.actions;

// Reducer
export default NotificationSlice.reducer;
