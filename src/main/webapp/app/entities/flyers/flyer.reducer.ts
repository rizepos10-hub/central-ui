import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IFlyer, defaultValue } from 'app/shared/model/flyer.model';

const initialState: EntityState<IFlyer> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/flyers';

const serializeFlyerEntity = (entity: IFlyer): IFlyer => {
  const payload: IFlyer = {
    id: entity.id,
    name: entity.name,
    branch: entity.branch
      ? {
          id: entity.branch.id,
          name: entity.branch.name,
        }
      : null,
    schedule: entity.schedule
      ? {
          startAt: entity.schedule.startAt ?? null,
          endAt: entity.schedule.endAt ?? null,
          application: entity.schedule.application ?? null,
          schedule: entity.schedule.schedule ?? null,
        }
      : null,
    entries: (entity.entries || [])
      .filter(entry => (entry.item?.id || entry.itemId) && (entry.variant?.id || entry.variantId))
      .map(entry => ({
        itemId: entry.item?.id || entry.itemId,
        variantId: entry.variant?.id || entry.variantId,
        price: entry.price ?? null,
        mixAndMatchRuleId: entry.mixAndMatchRule?.id || entry.mixAndMatchRuleId || null,
      })),
  };

  return payload;
};

export const getEntities = createAsyncThunk('flyer/fetch_entity_list', async ({ page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiUrl}${sort ? `?page=${page}&size=${size}&sort=${sort}&` : '?'}cacheBuster=${new Date().getTime()}`;
  return axios.get<IFlyer[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'flyer/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IFlyer>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'flyer/create_entity',
  async (entity: IFlyer, thunkAPI) => {
    const result = await axios.post<IFlyer>(apiUrl, cleanEntity(serializeFlyerEntity(entity)));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'flyer/update_entity',
  async (entity: IFlyer, thunkAPI) => {
    const result = await axios.put<IFlyer>(`${apiUrl}/${entity.id}`, cleanEntity(serializeFlyerEntity(entity)));
    thunkAPI.dispatch(getEntity(entity.id));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'flyer/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IFlyer>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: string; value: any }>('flyer/change-entity-field');

export const FlyerSlice = createEntitySlice({
  name: 'flyer',
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
      .addMatcher(isFulfilled(getEntities), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isFulfilled(createEntity, updateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity), state => {
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

export const { reset } = FlyerSlice.actions;

export default FlyerSlice.reducer;
