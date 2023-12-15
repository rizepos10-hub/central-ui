import axios from 'axios';
import { createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { cleanEntity } from 'app/shared/util/entity-utils';
import { IQueryParams, createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IFloorPlanSettings, defaultValue } from 'app/shared/model/floor-plan-settings.model';

const initialState: EntityState<IFloorPlanSettings> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/floor-plan-settings';

// Actions



export const getEntity = createAsyncThunk(
  'floor-plan-settings/fetch_entity',
  async () => {
    const requestUrl = `${apiUrl}`;
    return axios.get<IFloorPlanSettings>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);


export const updateEntity = createAsyncThunk(
  'floor-plan-settings/update_entity',
  async (entity: IFloorPlanSettings, thunkAPI) => {
    const result = await axios.put<IFloorPlanSettings>(`${apiUrl}`, cleanEntity(entity));
    thunkAPI.dispatch(getEntity());
    return result;
  },
  { serializeError: serializeAxiosError }
);





// slice

export const FloorPlanSettingsSlice = createEntitySlice({
  name: 'floor-plan-settings',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(getEntity.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = action.payload.data;
      })

      .addMatcher(isFulfilled( updateEntity), (state, action) => {
        state.updating = false;
        state.loading = false;
        state.updateSuccess = true;
        state.entity = action.payload.data;
      })
      .addMatcher(isPending(getEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending( updateEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = FloorPlanSettingsSlice.actions;

// Reducer
export default FloorPlanSettingsSlice.reducer;
