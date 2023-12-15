import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IFloorPlan, defaultValue } from 'app/shared/model/floor-plan.model';
import {IOrder} from "app/shared/model/order.model";

const initialState: EntityState<IFloorPlan> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/floor-plan';
const apiSearchUrl = 'api/_search/floor-plan';

// Actions

export const searchEntities = createAsyncThunk('floor-plan/search_entity', async ({ query, page, size, sort }: IQueryParams) => {
  const requestUrl = `${apiSearchUrl}?query=${query}${sort ? `&page=${page}&size=${size}&sort=${sort}` : ''}`;
  return axios.get<IFloorPlan[]>(requestUrl);
});

export const filterFloorPlans = createAsyncThunk(
  'order/filter_floor_plans',
  async (queryParams: any) => {
    try {
      const response = await axios.post<IFloorPlan[]>('api/floor-plan/_search', JSON.stringify(queryParams),
        {
          headers: {'Content-Type': 'application/json',},
        }
      );
      return response
    } catch (error) {
      throw new Error(error.message);
    }
  }
);
export const getEntity = createAsyncThunk(
  'floor-plan/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<IFloorPlan>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'floor-plan/create_entity',
  async (entity: IFloorPlan, thunkAPI) => {
    const result = await axios.post<IFloorPlan>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(filterFloorPlans({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'floor-plan/update_entity',
  async (entity: IFloorPlan, thunkAPI) => {
    const result = await axios.put<IFloorPlan>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(filterFloorPlans({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'floor-plan/partial_update_entity',
  async (entity: IFloorPlan, thunkAPI) => {
    const result = await axios.patch<IFloorPlan>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(filterFloorPlans({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'floor-plan/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<IFloorPlan>(requestUrl);
    thunkAPI.dispatch(filterFloorPlans({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

// slice

export const FloorPlanSlice = createEntitySlice({
  name: 'floor-plan',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addMatcher(isFulfilled(filterFloorPlans, searchEntities), (state, action :any) => {
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
      .addMatcher(isPending(filterFloorPlans, getEntity, searchEntities), state => {
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

export const { reset } = FloorPlanSlice.actions;

// Reducer
export default FloorPlanSlice.reducer;
