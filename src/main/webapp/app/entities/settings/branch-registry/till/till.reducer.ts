import axios from 'axios';
import { createAction, createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

import { cleanEntity } from 'app/shared/util/entity-utils';
import {
  IQueryParams,
  createEntitySlice,
  EntityState,
  serializeAxiosError,
  ChangeFieldPayload
} from "app/shared/reducers/reducer.utils";
import { ITill, defaultValue } from "app/shared/model/till.model";
import { IFilters } from "app/shared/model/filter-state.model";
import { getSummaryReportByTill } from "app/modules/analytics/reports/end-of-day/end-of-day.reducer";
import { RolePermissions } from "app/shared/model/user.model";


interface EntityWithReport<T> extends EntityState<T> {
  report: any;
}


const initialState: EntityWithReport<ITill> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
  report: {}
};

const apiUrl = 'api/tills';
const apiSearchUrl = 'api/_search/tills';

// Actions

export const searchEntities = createAsyncThunk('till/search_entity', async (filters: IFilters) => {
  const requestUrl = `${apiSearchUrl}`;
  return axios.post<ITill[]>(requestUrl, filters);
});

export const getEntities = createAsyncThunk('till/fetch_entity_list', async ({ page, size, sort, id: registryId }: IQueryParams) => {
  const requestUrl = `${apiUrl}?registryId=${registryId}${sort ? `&page=${page}&size=${size}&sort=${sort}&` : '&'}cacheBuster=${new Date().getTime()}`;
  return axios.get<ITill[]>(requestUrl);
});

export const getEntity = createAsyncThunk(
  'till/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}`;
    return axios.get<ITill>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const getEntityAReport = createAsyncThunk(
  'till/fetch_entity_report',
  async ( id: string | number) => {
    const requestUrl = `${apiUrl}/${id}/report`;
    return await axios.get<ITill>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const closeEntity = createAsyncThunk(
  'till/fetch_entity',
  async (id: string | number) => {
    const requestUrl = `${apiUrl}/${id}/close`;
    return axios.get<ITill>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);


export const confirmCloseEntity = createAsyncThunk(
  'till/fetch_entity',
  async ({ id, closeAmount }: { id: string | number; closeAmount: number }) => {
    const requestUrl = `${apiUrl}/${id}/confirm?closeAmount=${closeAmount}`;
    return axios.post<ITill>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);

export const getEntitiesByStatusOpened = createAsyncThunk(
  'till/fetch_entity',
  async (ids: string[]) => {
    const requestUrl = `${apiUrl}/open/by-register-ids?status=OPENED`;
    return axios.post<ITill>(requestUrl, ids);
  },
  { serializeError: serializeAxiosError }
);

export const createEntity = createAsyncThunk(
  'till/create_entity',
  async (entity: ITill, thunkAPI) => {
    const result = await axios.post<ITill>(apiUrl, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const updateEntity = createAsyncThunk(
  'till/update_entity',
  async (entity: ITill, thunkAPI) => {
    const result = await axios.put<ITill>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const partialUpdateEntity = createAsyncThunk(
  'till/partial_update_entity',
  async (entity: ITill, thunkAPI) => {
    const result = await axios.patch<ITill>(`${apiUrl}/${entity.id}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const deleteEntity = createAsyncThunk(
  'till/delete_entity',
  async (id: string | number, thunkAPI) => {
    const requestUrl = `${apiUrl}/${id}`;
    const result = await axios.delete<ITill>(requestUrl);
    thunkAPI.dispatch(getEntities({}));
    return result;
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<ChangeFieldPayload<Pick<ITill, 'name'>>>('till/change-entity-field');


// slice

export const TillSlice = createSlice({
  name: 'till',
  reducers: {
    reset() {
      return initialState;
    },
  },
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        const { name, value } = action.payload;
        state.entity[name] = value;
      })
      .addCase(deleteEntity.fulfilled, state => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = {};
      })
      .addMatcher(isFulfilled(getEntity, getEntityAReport), (state, action) => {
        state.loading = false;
        state.report = action.payload.data;
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
      .addMatcher(isFulfilled(createEntity, updateEntity, partialUpdateEntity, closeEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntities, getEntity, searchEntities, getEntityAReport), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(createEntity, updateEntity, partialUpdateEntity, deleteEntity, closeEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = TillSlice.actions;

// Reducer
export default TillSlice.reducer;
