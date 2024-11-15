import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { ILoyaltyCard, defaultValue, ILoyaltyCardBalance } from 'app/shared/model/loyalty-card.model';

const initialState: EntityState<ILoyaltyCard> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};
const apiUrl = 'api/loyalty-cards';
const apiSearchUrl = 'api/_search/loyalty-cards';

// Actions

export const searchEntities = createAsyncThunk('loyaltycard/filter_entity_list', async ({ query, }: IQueryParams) => {
  return axios.post<ILoyaltyCard[]>(apiSearchUrl, query);
});


export const getEntities = createAsyncThunk('loyaltycard/fetch_entity_list', async ({ page, size, sort, query }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&query=${query}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ILoyaltyCard[]>(requestUrl);
});

export const getWallets = createAsyncThunk('loyaltycard/fetch_entity_list', async ({ page, size, sort, query }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&query=${query}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ILoyaltyCard[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'loyaltycard/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ILoyaltyCard>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'loyaltycard/create_entity',
  async (entity: ILoyaltyCard, thunkAPI) => {
    const result = await axios.post<ILoyaltyCard>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const addBalance = createAsyncThunk(
  'loyaltycard/create_entity',
  async ({ entity, refNumber }: { entity: ILoyaltyCardBalance, refNumber: string }, thunkAPI) => {
    const result = await axios.post<ILoyaltyCardBalance>(`${apiUrl}/${refNumber}/add-balance`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const transferFundsFromCard = createAsyncThunk(
  'loyaltycard/create_entity',
  async ({ fromCard, toCard, amount, comment }: { fromCard: string; toCard: string; amount: number; comment?: string }, thunkAPI) => {
    const result = await axios.post<ILoyaltyCard>(`${apiUrl}/transfer/by-reference-number?fromCard=${fromCard}&toCard=${toCard}&amount=${amount}&comment=${comment}`);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);


export const updateEntity = createAsyncThunk(
  'loyaltycard/update_entity',
  async (entity: ILoyaltyCard, thunkAPI) => {
    const result = await axios.put<ILoyaltyCard>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'loyaltycard/partial_update_entity',
  async (entity: ILoyaltyCard, thunkAPI) => {
    const result = await axios.patch<ILoyaltyCard>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'loyaltycard/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ILoyaltyCard>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: string; value: any }>('loyaltycard/change-entity-field');

// slice

export const LoyaltyCardSlice = createEntitySlice({
  name: 'loyaltycard',
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
      .addMatcher(isFulfilled(getEntities, searchEntities), (state, action) => {
        const { data, headers } = action.payload;

        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = LoyaltyCardSlice.actions;

// Reducer
export default LoyaltyCardSlice.reducer;
