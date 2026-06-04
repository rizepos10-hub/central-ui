import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ICustomer, defaultValue } from 'app/shared/model/CUSTOMER/customer.model';
import { ICustomerPayByOnAccountRequest } from 'app/shared/model/customer-pay-by-on-account.model';

const initialState: EntityState<ICustomer> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};
const priceApiUrl = 'api/customer-item-price';
const apiUrl = 'api/customers';
const apiSearchUrl = 'api/_search/customers';

// Actions

export const searchEntities = createAsyncThunk('customer/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<ICustomer[]>(requestUrl);
});

export const searchCustomers = createAsyncThunk('loyaltyRecords/fetch_loyalty_customers', async (queryParams: any) => {
  return axios.post<ICustomer[]>(apiSearchUrl, queryParams);
});

export const getEntities = createAsyncThunk('customer/fetch_entity_list', async ({ page, size, sort, query }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&query=${query}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ICustomer[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'customer/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ICustomer>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const getEntityInfo = createAsyncThunk(
  'customer/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}/info`;
    return axios.get<ICustomer>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'customer/create_entity',
  async (entity: ICustomer, thunkAPI) => {
    const result = await axios.post<ICustomer>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);



export const getPricesForCustomer = createAsyncThunk(
  'customer/fetch_customer_prices',
  async (customerId: string | number) => {
    const requestUrl = `api/customer-item-price/customer/${customerId}`;
    return axios.get(requestUrl);
  },

);

export const updatePrices = createAsyncThunk(
  'customer/update_prices',
  async ({ pricesData, customerId }: any) => {
    const request = `${priceApiUrl}/${customerId}`
    const result = await axios.put(request, (pricesData));

    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'customer/update_entity',
  async (entity: ICustomer, thunkAPI) => {
    const result = await axios.put<ICustomer>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const payByOnAccount = createAsyncThunk(
  'customer/pay_by_on_account',
  async ({ customerId, entity }: { customerId: string; entity: ICustomerPayByOnAccountRequest }) => {
    return axios.post(`${apiUrl}/${customerId}/pay-by-on-account`, cleanEntity(entity));
  },
  { serializeError: serializeAxiosError }
);

export const assignCard = createAsyncThunk(
  'customer/assign_card',
  async ({ entity, cardRefNumber }: { entity: ICustomer, cardRefNumber: string }, thunkAPI) => {
    const result = await axios.post<ICustomer>(`${apiUrl}/${entity.id}/assign-card?cardRefNumber=${cardRefNumber}`);
    thunkAPI.dispatch(getEntity(entity.id));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'customer/partial_update_entity',
  async (entity: ICustomer, thunkAPI) => {
    const result = await axios.patch<ICustomer>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'customer/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ICustomer>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: string; value: any }>('customer/change-entity-field');

// slice

export const CustomerSlice = createEntitySlice({
  name: 'customer',
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
      .addCase(payByOnAccount.fulfilled, state => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
      })
      .addMatcher(isFulfilled(getEntities, searchEntities, searchCustomers), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, assignCard, partialUpdateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities, searchCustomers), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, assignCard, partialUpdateEntity, deleteEntity, payByOnAccount), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = CustomerSlice.actions;

// Reducer
export default CustomerSlice.reducer;
