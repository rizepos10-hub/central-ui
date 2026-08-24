import axios from 'axios';
import { createAction, createAsyncThunk, isFulfilled, isPending, isRejected } from '@reduxjs/toolkit';

import { createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import {
  defaultSenitronSetting,
  ISenitronSetting,
  ISenitronSettingRequest,
  normalizeSenitronSetting,
} from 'app/shared/model/senitron-setting.model';

const initialState: EntityState<ISenitronSetting> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultSenitronSetting,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/settings/senitron';

export const getSenitronSetting = createAsyncThunk(
  'senitronSetting/fetch',
  async () => axios.get<ISenitronSetting>(apiUrl),
  { serializeError: serializeAxiosError }
);

export const updateSenitronSetting = createAsyncThunk(
  'senitronSetting/update',
  async (request: ISenitronSettingRequest) => axios.put<ISenitronSetting>(apiUrl, request),
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: keyof ISenitronSetting; value: ISenitronSetting[keyof ISenitronSetting] }>(
  'senitronSetting/change-entity-field'
);

export const SenitronSettingSlice = createEntitySlice({
  name: 'senitronSetting',
  initialState,
  extraReducers(builder) {
    builder
      .addCase(changeEntityField, (state, action) => {
        state.entity = {
          ...normalizeSenitronSetting(state.entity),
          [action.payload.name]: action.payload.value,
        };
      })
      .addCase(getSenitronSetting.fulfilled, (state, action) => {
        state.loading = false;
        state.entity = normalizeSenitronSetting(action.payload.data);
      })
      .addMatcher(isFulfilled(updateSenitronSetting), (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        state.entity = normalizeSenitronSetting(action.payload.data);
      })
      .addMatcher(isPending(getSenitronSetting), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.loading = true;
      })
      .addMatcher(isPending(updateSenitronSetting), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      })
      .addMatcher(isRejected(getSenitronSetting, updateSenitronSetting), (state, action) => {
        state.loading = false;
        state.updating = false;
        state.updateSuccess = false;
        state.errorMessage = action.error.message;
      });
  },
});

export const { reset } = SenitronSettingSlice.actions;
export default SenitronSettingSlice.reducer;
