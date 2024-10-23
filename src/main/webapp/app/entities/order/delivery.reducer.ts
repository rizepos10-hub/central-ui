import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { createEntitySlice, EntityState, serializeAxiosError, ChangeFieldPayload } from 'app/shared/reducers/reducer.utils';
import { IDeliveryBooking, defaultValue } from 'app/shared/model/delivery.model';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { getEntity as getOrder } from './order.reducer';

const initialState: EntityState<IDeliveryBooking> = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: defaultValue,
    updating: false,
    updateSuccess: false,
    orderSources: []
};

const apiUrl = 'api/delivery';
// Actions

export const createBooking = createAsyncThunk(
    'order/createBooking',
    async (entity: IDeliveryBooking, thunkAPI) => {
        const result = await axios.post<IDeliveryBooking>(`${apiUrl}/add-booking?orderId=${entity.orderId}&date=${entity.date}`);
        thunkAPI.dispatch(getOrder(entity.orderId));
        return result;
    },
    { serializeError: serializeAxiosError }
);

export const updateBooking = createAsyncThunk(
    'order/updateBooking',
    async (entity: IDeliveryBooking, thunkAPI) => {
        const result = await axios.put<IOrder>(`${apiUrl}/update-booking/${entity.orderId}?date=${entity.date}`);
        thunkAPI.dispatch(getOrder(entity.orderId));
        return result;
    },
    { serializeError: serializeAxiosError }
);

export const cancelBooking = createAsyncThunk(
    'order/cancelBooking',
    async (entity: IOrder, thunkAPI) => {
        const result = await axios.post<IOrder>(`${apiUrl}/cancel-booking/${entity.id}`);
        thunkAPI.dispatch(getOrder(entity.id));
        return result;
    },
    { serializeError: serializeAxiosError }
);

// slice
export const changeEntityField = createAction<ChangeFieldPayload<IDeliveryBooking>>('online-ordering-settings/change-entity-field');

export const DeliverySlice = createEntitySlice({
    name: 'delivery',
    initialState,
    extraReducers(builder) {
        builder
            .addCase(changeEntityField, (state, action) => {
                const { name, value } = action.payload;
                if (!name) {
                    state.entity = value;
                } else {
                    state.entity[name] = value;
                }
            })
            .addCase(cancelBooking.fulfilled, state => {
                state.updating = false;
                state.updateSuccess = true;
                state.entity = {};
            })
            .addMatcher(isFulfilled(createBooking, updateBooking, cancelBooking), (state, action) => {
                state.updating = false;
                state.loading = false;
                state.updateSuccess = true;
                state.entity = action.payload.data;
            })
            .addMatcher(isPending(createBooking, updateBooking, cancelBooking), state => {
                state.errorMessage = null;
                state.updateSuccess = false;
                state.updating = true;
            });
    },
});

export const { reset } = DeliverySlice.actions;

// Reducer
export default DeliverySlice.reducer;
