import axios from 'axios';
import { createAction, createAsyncThunk, createSlice, isFulfilled, isPending, isRejected } from "@reduxjs/toolkit";

import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError, ChangeFieldPayload } from 'app/shared/reducers/reducer.utils';
import { IUserClock, defaultValue } from "app/shared/model/user-clock.model";

interface EntityWithReport extends EntityState<IUserClock> {
  report: IUserClock["report"];
  loadingReport: boolean
}

const initialState: EntityWithReport = {
  loading: false,
  errorMessage: null,
  entities: [],
  report: null,
  loadingReport: false,
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/user-clocks';
const apiSearchUrl = 'api/_search/user-clocks';

// Actions

export const filterEntities = createAsyncThunk('user-clocks/filter_entity_list',
  async ({ query }: IQueryParams) => {
  return axios.post<IUserClock[]>(apiSearchUrl, query);
});

export const getEntityReport = createAsyncThunk('user-clocks/fetch_entity_report',
  async ( id: string | number) => {
  const requestUrl = `${apiUrl}/${id}/generate-report`
  return axios.get<IUserClock["report"]>(requestUrl);
});

// slice

export const UserClocksSlice = createSlice({
  name: 'user-clocks',
  initialState,
  reducers: {
    reset() {
      return initialState;
    }
  },
  extraReducers(builder) {
    builder
      .addMatcher(isFulfilled(filterEntities), (state, action) => {
        const { data, headers } = action.payload;
        return {
          ...state,
          loading: false,
          entities: data,
          totalItems: parseInt(headers['x-total-count'], 10),
        };
      })
      .addMatcher(isPending(filterEntities), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isFulfilled(getEntityReport), (state, action) => {
        return {
          ...state,
          loadingReport: false,
          report: action.payload.data,
        };
      })
      .addMatcher(isPending(getEntityReport), state => {
        state.loadingReport = true;
      })
  },
});

export const { reset } = UserClocksSlice.actions;

// Reducer
export default UserClocksSlice.reducer;
