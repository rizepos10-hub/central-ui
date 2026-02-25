import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { createEntitySlice, EntityState, serializeAxiosError, ChangeFieldPayload } from 'app/shared/reducers/reducer.utils';
import { IDeliveryBooking, defaultValue } from 'app/shared/model/delivery.model';
import { IOrder } from 'app/shared/model/ORDER/order.model';
import { getEntity as getOrder } from './order.reducer';

type DeliveryState = EntityState<IDeliveryBooking> & {
    activeProviders: Array<'ICABBI' | 'TOOKAN'>;
    teams: any[];
    agents: any[];
};

const initialState: DeliveryState = {
    loading: false,
    errorMessage: null,
    entities: [],
    entity: defaultValue,
    updating: false,
    updateSuccess: false,
    orderSources: [],
    activeProviders: [],
    teams: [],
    agents: [],
};

const apiUrl = 'api/delivery';
// Actions

const buildDateParams = (entity: IDeliveryBooking) => {
    const params = new URLSearchParams();
    if (entity.pickupDate) params.set('pickupDate', entity.pickupDate);
    if (entity.deliveryDate) params.set('deliveryDate', entity.deliveryDate);
    if (!entity.pickupDate && !entity.deliveryDate && entity.date) params.set('date', entity.date);
    return params;
};

export const createBooking = createAsyncThunk(
    'order/createBooking',
    async (entity: IDeliveryBooking, thunkAPI) => {
        const params = buildDateParams(entity);
        params.set('orderId', entity.orderId);
        if (entity.provider) {
            params.set('provider', entity.provider);
        }
        const result = await axios.post(`${apiUrl}/add-booking?${params.toString()}`);
        thunkAPI.dispatch(getOrder(entity.orderId));
        return result;
    },
    { serializeError: serializeAxiosError }
);

export const updateBooking = createAsyncThunk(
    'order/updateBooking',
    async (entity: IDeliveryBooking, thunkAPI) => {
        const params = buildDateParams(entity);
        const result = await axios.put<IOrder>(`${apiUrl}/update-booking/${entity.orderId}?${params.toString()}`);
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

export const getActiveProviders = createAsyncThunk(
    'order/getActiveProviders',
    async (orderId: string) => {
        const result = await axios.get<Array<'ICABBI' | 'TOOKAN'>>(`${apiUrl}/providers/${orderId}`);
        return result;
    },
    { serializeError: serializeAxiosError }
);

export const syncBooking = createAsyncThunk(
    'order/syncBooking',
    async (orderId: string, thunkAPI) => {
        const result = await axios.post(`${apiUrl}/sync-booking/${orderId}`);
        thunkAPI.dispatch(getOrder(orderId));
        return result;
    },
    { serializeError: serializeAxiosError }
);

export const assignDriver = createAsyncThunk(
    'order/assignDriver',
    async (entity: IDeliveryBooking, thunkAPI) => {
        if (!entity.driverId) {
            throw new Error('driverId is required');
        }
        if (!entity.teamId) {
            throw new Error('teamId is required');
        }
        const params = new URLSearchParams();
        params.set('driverId', entity.driverId);
        params.set('teamId', entity.teamId);
        const result = await axios.put(`${apiUrl}/assign-driver/${entity.orderId}?${params.toString()}`);
        thunkAPI.dispatch(getOrder(entity.orderId));
        return result;
    },
    { serializeError: serializeAxiosError }
);

export const getTookanTeams = createAsyncThunk(
    'order/getTookanTeams',
    async (branchId: string) => {
        const result = await axios.get<any[]>(`api/tookan/teams/${branchId}`);
        return result;
    },
    { serializeError: serializeAxiosError }
);

export const getTookanAgents = createAsyncThunk(
    'order/getTookanAgents',
    async ({ branchId, teamId }: { branchId: string; teamId?: number | null }) => {
        const query = teamId != null ? `?teamId=${teamId}` : '';
        const result = await axios.get<any[]>(`api/tookan/agents/${branchId}${query}`);
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
            .addCase(getActiveProviders.fulfilled, (state, action) => {
                state.loading = false;
                state.activeProviders = action.payload.data ?? [];
            })
            .addCase(getTookanTeams.fulfilled, (state, action) => {
                state.loading = false;
                state.teams = action.payload.data ?? [];
            })
            .addCase(getTookanAgents.fulfilled, (state, action) => {
                state.loading = false;
                state.agents = action.payload.data ?? [];
            })
            .addMatcher(isFulfilled(createBooking, updateBooking, cancelBooking, syncBooking, assignDriver), (state, action) => {
                state.updating = false;
                state.loading = false;
                state.updateSuccess = true;
                state.entity = action.payload.data;
            })
            .addMatcher(isPending(createBooking, updateBooking, cancelBooking, syncBooking, assignDriver), state => {
                state.errorMessage = null;
                state.updateSuccess = false;
                state.updating = true;
            })
            .addMatcher(isPending(getActiveProviders, getTookanTeams, getTookanAgents), state => {
                state.errorMessage = null;
                state.loading = true;
            });
    },
});

export const { reset } = DeliverySlice.actions;

// Reducer
export default DeliverySlice.reducer;
