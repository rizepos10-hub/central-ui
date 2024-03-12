import axios from 'axios';
import {createAction, createAsyncThunk, isFulfilled, isPending, isRejected} from '@reduxjs/toolkit';

import {  createEntitySlice, EntityState, serializeAxiosError } from 'app/shared/reducers/reducer.utils';
import { IUiSettings, defaultValue } from 'app/shared/model/ONLINE_ORDERING/ui-setting.model';

const initialState: EntityState<IUiSettings> = {
  loading: false,
  errorMessage: null,
  entities: [],
  entity: defaultValue,
  updating: false,
  totalItems: 0,
  updateSuccess: false,
};

const apiUrl = 'api/online-ordering/settings/ui-settings';

// Actions


export const getEntity = createAsyncThunk(
  'online-ordering-settings/fetch_entity',
  async () => {
    const requestUrl = `${apiUrl}`;
    return axios.get<IUiSettings>(requestUrl);
  },
  { serializeError: serializeAxiosError }
);


export const updateEntity = createAsyncThunk(
  'online-ordering-settings/update_entity',
  async (settings: IUiSettings, thunkAPI) => {

    return await axios.put<IUiSettings>(`${apiUrl}`, settings);
  },
  { serializeError: serializeAxiosError }
);

export const changeEntityField = createAction<{ name: keyof IUiSettings; value: IUiSettings[keyof IUiSettings]}>('online-ordering-settings/change-entity-field');




// slice

export const UiSettingsSlice = createEntitySlice({
  name: 'UiSettings',
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
      .addMatcher(isFulfilled(updateEntity), (state, action) => {
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
      .addMatcher(isPending(updateEntity), state => {
        state.errorMessage = null;
        state.updateSuccess = false;
        state.updating = true;
      });
  },
});

export const { reset } = UiSettingsSlice.actions;

// Reducer
export default UiSettingsSlice.reducer;
