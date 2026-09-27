import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IPaymentMethodSetting, defaultValue } from 'app/shared/model/payment-method-setting.model';

const initialState: EntityState<IPaymentMethodSetting> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/payment-method-settings';

// Actions

export const getAllEntities = createAsyncThunk(
  'paymentMethodSetting/fetch_all_entities',
  async () => {
    const requestUrl = `${apiUrl}/all`;
    return axios.get<IPaymentMethodSetting[]>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const getEntities = createAsyncThunk(
  'paymentMethodSetting/fetch_entity_list',
  async ({ page, size, sort }: IQueryParams) => {
    const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
    return axios.get<IPaymentMethodSetting[]>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const getEntity = createAsyncThunk(
  'paymentMethodSetting/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IPaymentMethodSetting>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'paymentMethodSetting/create_entity',
  async (entity: IPaymentMethodSetting, thunkAPI) => {
    const result = await axios.post<IPaymentMethodSetting>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getAllEntities());
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'paymentMethodSetting/update_entity',
  async (
    payload: IPaymentMethodSetting | { entity: IPaymentMethodSetting; refreshList?: boolean },
    thunkAPI
  ) => {
    const entity = 'entity' in payload ? payload.entity : payload;
    const refreshList = 'entity' in payload ? payload.refreshList !== false : true;
    const result = await axios.put<IPaymentMethodSetting>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    if (refreshList) {
      thunkAPI.dispatch(getAllEntities());
    }
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'paymentMethodSetting/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IPaymentMethodSetting>(requestUrl);
    thunkAPI.dispatch(getAllEntities());
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const makeCheckAvailable = () => axios.post<IPaymentMethodSetting>(`${apiUrl}/check/make-available`);

export const changeEntityField = createAction<{ name: string; value: any }>('paymentMethodSetting/change-entity-field');

// slice

export const PaymentMethodSettingSlice = createEntitySlice({
  name: 'paymentMethodSetting',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value;
      })
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addMatcher(isFulfilled(getAllEntities, getEntities), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: headers?.['x-total-count'] ? parseInt(headers['x-total-count'], 10) : data?.length || 0,
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getAllEntities, getEntities, getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, deleteEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = PaymentMethodSettingSlice.actions;

// Reducer
export default PaymentMethodSettingSlice.reducer;
